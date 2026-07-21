#!/usr/bin/env python3
"""Collect read-only contributor and stewardship signals from Git history.

The script emits name-only, mailmap-aware JSON. It deliberately avoids commit
messages, exact timestamps, email addresses, and human-performance interpretation.
"""
from __future__ import annotations

import argparse
import fnmatch
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath
from typing import Iterable, Sequence


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


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Collect evidence-calibrated contributor signals as JSON."
    )
    p.add_argument("--repo", default=".", help="Repository path. Default: current directory")
    p.add_argument("--ref", default="HEAD", help="Revision to analyse. Default: HEAD")
    p.add_argument(
        "--since", default="6 months ago", help="Git --since value. Default: 6 months ago"
    )
    p.add_argument(
        "--top", type=int, default=20, help="Maximum contributors and rows per list. Default: 20"
    )
    p.add_argument(
        "--path",
        action="append",
        default=[],
        help="Path scope relative to the repository root. Repeatable.",
    )
    p.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Glob or directory-prefix exclusion applied after Git collection. Repeatable.",
    )
    p.add_argument(
        "--path-depth",
        type=int,
        default=2,
        help="Maximum directory depth used to group files into areas. Default: 2",
    )
    p.add_argument(
        "--include-merges",
        action="store_true",
        help="Include merge commits. Excluded by default.",
    )
    return p


def matches_exclusion(path: str, patterns: Iterable[str]) -> bool:
    name = PurePosixPath(path).name
    for raw_pattern in patterns:
        pattern = raw_pattern.replace("\\", "/").lstrip("./")
        if not pattern:
            continue
        if pattern.endswith("/") and path.startswith(pattern):
            return True
        if fnmatch.fnmatch(path, pattern) or fnmatch.fnmatch(name, pattern):
            return True
    return False


def area_for(path: str, depth: int) -> str:
    parts = PurePosixPath(path).parts
    directories = parts[:-1]
    if not directories:
        return "(root)"
    return "/".join(directories[:depth])


def ranked(counter: Counter[str], limit: int, key_name: str) -> list[dict[str, object]]:
    rows = sorted(counter.items(), key=lambda item: (-item[1], item[0]))[:limit]
    return [{key_name: key, "commit_count": count} for key, count in rows]


def parse_history(output: str) -> list[dict[str, object]]:
    commits: list[dict[str, object]] = []
    for raw_record in output.split("\x1e"):
        record = raw_record.strip("\n")
        if not record.strip():
            continue
        lines = record.splitlines()
        header_index = next((index for index, line in enumerate(lines) if line.strip()), None)
        if header_index is None:
            continue
        header = lines[header_index].split("\x1f")
        if len(header) != 4:
            continue
        sha, name, email, date = (part.strip() for part in header)
        paths = sorted({line.strip() for line in lines[header_index + 1 :] if line.strip()})
        commits.append(
            {
                "sha": sha,
                "name": name or "(unknown)",
                "email": email,
                "date": date,
                "paths": paths,
            }
        )
    return commits


def is_possible_automation(name: str) -> bool:
    lowered = name.casefold().strip()
    return "[bot]" in lowered or lowered.endswith(" bot") or lowered.startswith("bot ")


def main() -> int:
    args = parser().parse_args()
    if args.top < 1 or args.top > 500:
        print("--top must be between 1 and 500", file=sys.stderr)
        return 2
    if args.path_depth < 1 or args.path_depth > 10:
        print("--path-depth must be between 1 and 10", file=sys.stderr)
        return 2

    repo = Path(args.repo).expanduser().resolve()
    try:
        root = Path(run_git(repo, ["rev-parse", "--show-toplevel"], allow_empty=False).strip())
        run_git(root, ["rev-parse", "--verify", f"{args.ref}^{{commit}}"], allow_empty=False)
        shallow = run_git(root, ["rev-parse", "--is-shallow-repository"]).strip() == "true"

        log_args = [
            "log",
            "--format=%x1e%H%x1f%aN%x1f%aE%x1f%ad",
            "--date=short",
            "--name-only",
            f"--since={args.since}",
        ]
        if not args.include_merges:
            log_args.append("--no-merges")
        log_args.append(args.ref)
        if args.path:
            log_args.append("--")
            log_args.extend(args.path)

        commits = parse_history(run_git(root, log_args))

        contributor_commits: Counter[str] = Counter()
        contributor_months: dict[str, set[str]] = defaultdict(set)
        contributor_dates: dict[str, list[str]] = defaultdict(list)
        contributor_paths: dict[str, Counter[str]] = defaultdict(Counter)
        contributor_areas: dict[str, Counter[str]] = defaultdict(Counter)
        area_commits: Counter[str] = Counter()
        area_contributors: dict[str, Counter[str]] = defaultdict(Counter)
        name_emails: dict[str, set[str]] = defaultdict(set)
        possible_automation: set[str] = set()
        included_commits = 0

        for commit in commits:
            name = str(commit["name"])
            email = str(commit["email"])
            date = str(commit["date"])
            paths = [
                str(path)
                for path in commit["paths"]
                if not matches_exclusion(str(path), args.exclude)
            ]
            if not paths:
                continue

            included_commits += 1
            contributor_commits[name] += 1
            if date:
                contributor_dates[name].append(date)
                contributor_months[name].add(date[:7])
            if email:
                name_emails[name].add(email.casefold())
            if is_possible_automation(name):
                possible_automation.add(name)

            areas = {area_for(path, args.path_depth) for path in paths}
            for path in paths:
                contributor_paths[name][path] += 1
            for area in areas:
                contributor_areas[name][area] += 1
                area_commits[area] += 1
                area_contributors[area][name] += 1

        contributor_rows: list[dict[str, object]] = []
        for name, count in sorted(
            contributor_commits.items(), key=lambda item: (-item[1], item[0])
        )[: args.top]:
            dates = sorted(contributor_dates[name])
            contributor_rows.append(
                {
                    "name": name,
                    "commit_count": count,
                    "active_months": len(contributor_months[name]),
                    "first_observed": dates[0] if dates else None,
                    "last_observed": dates[-1] if dates else None,
                    "top_areas": ranked(contributor_areas[name], args.top, "area"),
                    "top_paths": ranked(contributor_paths[name], args.top, "path"),
                }
            )

        area_rows: list[dict[str, object]] = []
        for area, total in sorted(area_commits.items(), key=lambda item: (-item[1], item[0]))[
            : args.top
        ]:
            contributor_counts = area_contributors[area]
            top_contributors = []
            for name, count in sorted(
                contributor_counts.items(), key=lambda item: (-item[1], item[0])
            )[: args.top]:
                top_contributors.append(
                    {
                        "name": name,
                        "commit_count": count,
                        "share": round(count / total, 4) if total else 0.0,
                    }
                )
            area_rows.append(
                {
                    "area": area,
                    "change_commits": total,
                    "unique_contributors": len(contributor_counts),
                    "top_contributor_share": top_contributors[0]["share"]
                    if top_contributors
                    else 0.0,
                    "top_contributors": top_contributors,
                }
            )

        ambiguous_names = sorted(name for name, emails in name_emails.items() if len(emails) > 1)
        warnings: list[str] = []
        if shallow:
            warnings.append("Repository is shallow; contributor signals are incomplete.")
        if included_commits == 0:
            warnings.append("No non-excluded commits matched the selected revision, scope, and time window.")
        if ambiguous_names:
            warnings.append(
                "One or more normalised names map to multiple canonical email identities; confirm identity resolution."
            )
        if possible_automation:
            warnings.append(
                "Possible automated identities are present; confirm whether they should be excluded."
            )

        result = {
            "schema_version": "1.0",
            "evidence_frame": {
                "repository_root": str(root),
                "ref": args.ref,
                "since": args.since,
                "paths": args.path,
                "exclusions": args.exclude,
                "path_depth": args.path_depth,
                "include_merges": args.include_merges,
                "identity_detail": "mailmap-aware name only",
            },
            "commit_count": included_commits,
            "contributors": contributor_rows,
            "areas": area_rows,
            "identity_checks": {
                "ambiguous_names": ambiguous_names,
                "possible_automated_identities": sorted(possible_automation),
            },
            "interpretation_limits": [
                "Commit counts are not productivity, impact, quality, diligence, velocity, or value.",
                "Contribution concentration is not bus factor, ownership, authority, or irreplaceability.",
                "First and last observed dates are not employment dates or availability.",
                "Path history does not establish current expertise, stewardship, or willingness to review.",
                "Git history must not be used to infer personality, psychology, personal circumstances, or likely behaviour.",
                "Commit dates do not establish working hours, wellbeing, location, or work-life balance.",
                "Squashes, rebases, pairing, co-authorship, bots, imports, and missing history can distort attribution.",
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
