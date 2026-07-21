#!/usr/bin/env python3
"""Collect read-only Git history signals for repository investigation.

The script emits JSON and deliberately avoids interpreting commit activity as
productivity, team health, ownership authority, defect causation, code risk, or
human traits. Contributor activity is mailmap-aware and name-only.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Sequence

FIX_PATTERN = r"fix|bug|defect|regression|broken"
OPERATIONS_PATTERN = r"revert|hotfix|emergency|rollback"


class GitError(RuntimeError):
    pass


def run_git(repo: Path, args: Sequence[str], *, allow_empty: bool = True) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0:
        message = proc.stderr.strip() or proc.stdout.strip() or "unknown git error"
        raise GitError(f"git {' '.join(args)} failed: {message}")
    if not allow_empty and not proc.stdout.strip():
        raise GitError(f"git {' '.join(args)} returned no data")
    return proc.stdout


def count_paths(output: str, top: int) -> list[dict[str, object]]:
    counts = Counter(line.strip() for line in output.splitlines() if line.strip())
    return [{"path": path, "touch_count": count} for path, count in counts.most_common(top)]


def parse_shortlog(output: str, top: int) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for raw in output.splitlines():
        raw = raw.strip()
        if not raw:
            continue
        count_text, _, identity = raw.partition("\t")
        try:
            count = int(count_text.strip())
        except ValueError:
            continue
        rows.append({"identity": identity.strip(), "commit_count": count})
    return rows[:top]


def parse_keyword_commits(output: str, top: int) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for raw in output.splitlines():
        sha, sep, remainder = raw.partition("\t")
        if not sep:
            continue
        date, sep, subject = remainder.partition("\t")
        if not sep:
            continue
        rows.append({"sha": sha, "date": date, "subject": subject})
    return rows[:top]


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Collect evidence-calibrated Git history signals as JSON."
    )
    p.add_argument("--repo", default=".", help="Repository path. Default: current directory")
    p.add_argument("--ref", default="HEAD", help="Revision to analyse. Default: HEAD")
    p.add_argument("--since", default="6 months ago", help="Git --since value. Default: 6 months ago")
    p.add_argument("--top", type=int, default=20, help="Maximum rows per ranked signal. Default: 20")
    return p


def main() -> int:
    args = parser().parse_args()
    if args.top < 1 or args.top > 500:
        print("--top must be between 1 and 500", file=sys.stderr)
        return 2

    repo = Path(args.repo).expanduser().resolve()
    try:
        root = Path(run_git(repo, ["rev-parse", "--show-toplevel"], allow_empty=False).strip())
        run_git(root, ["rev-parse", "--verify", f"{args.ref}^{{commit}}"], allow_empty=False)
        shallow = run_git(root, ["rev-parse", "--is-shallow-repository"]).strip() == "true"
        commit_count_text = run_git(
            root, ["rev-list", "--count", f"--since={args.since}", args.ref]
        ).strip()
        commit_count = int(commit_count_text or "0")

        changed = run_git(
            root, ["log", "--format=", "--name-only", f"--since={args.since}", args.ref]
        )
        fix_files = run_git(
            root,
            [
                "log",
                "--regexp-ignore-case",
                "--extended-regexp",
                f"--grep={FIX_PATTERN}",
                "--format=",
                "--name-only",
                f"--since={args.since}",
                args.ref,
            ],
        )
        shortlog = run_git(
            root, ["shortlog", "-sn", f"--since={args.since}", args.ref]
        )
        month_output = run_git(
            root, ["log", "--format=%ad", "--date=format:%Y-%m", f"--since={args.since}", args.ref]
        )
        operation_commits = run_git(
            root,
            [
                "log",
                "--regexp-ignore-case",
                "--extended-regexp",
                f"--grep={OPERATIONS_PATTERN}",
                "--format=%H%x09%ad%x09%s",
                "--date=short",
                f"--since={args.since}",
                args.ref,
            ],
        )

        warnings = []
        if shallow:
            warnings.append("Repository is shallow; historical signals are incomplete.")
        if commit_count == 0:
            warnings.append("No commits matched the selected revision and time window.")

        result = {
            "schema_version": "1.1",
            "repository_root": str(root),
            "ref": args.ref,
            "since": args.since,
            "commit_count": commit_count,
            "identity_detail": "mailmap-aware name only",
            "signals": {
                "file_touch_frequency": count_paths(changed, args.top),
                "fix_keyword_file_associations": count_paths(fix_files, args.top),
                "contributor_commit_activity": parse_shortlog(shortlog, args.top),
                "monthly_commit_activity": [
                    {"month": month, "commit_count": count}
                    for month, count in sorted(Counter(month_output.split()).items())
                ],
                "operational_keyword_commits": parse_keyword_commits(operation_commits, args.top),
            },
            "interpretation_limits": [
                "File touch frequency is not code risk or complexity.",
                "Fix-keyword association is not proof that a file caused a defect.",
                "Commit concentration is not bus factor, authority, productivity, or team health.",
                "Commit volume is not delivery velocity or value.",
                "Reduced activity does not establish departure, disengagement, or performance.",
                "Git history must not be used to infer personality, psychology, personal circumstances, or likely behaviour.",
                "Commit timestamps do not establish working hours, availability, diligence, wellbeing, or work-life balance.",
                "Commit-message style may be templated, generated, squashed, automated, or written by someone other than the recorded author.",
            ],
            "warnings": warnings,
        }
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0
    except (GitError, OSError, ValueError) as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
