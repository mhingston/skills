#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("analyse-history.py")


def run(cmd, cwd, env=None):
    return subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )


def commit(repo: Path, path: str, content: str, message: str, name: str, email: str, date: str):
    target = repo / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    run(["git", "add", path], repo)
    env = os.environ.copy()
    env.update(
        {
            "GIT_AUTHOR_NAME": name,
            "GIT_AUTHOR_EMAIL": email,
            "GIT_COMMITTER_NAME": name,
            "GIT_COMMITTER_EMAIL": email,
            "GIT_AUTHOR_DATE": date,
            "GIT_COMMITTER_DATE": date,
        }
    )
    run(["git", "commit", "-m", message], repo, env)


class AnalyseHistoryTests(unittest.TestCase):
    def test_collects_signals_without_claiming_risk_or_exposing_email(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            run(["git", "init"], repo)
            run(["git", "config", "user.name", "Test User"], repo)
            run(["git", "config", "user.email", "test@example.com"], repo)

            env = os.environ.copy()
            env.update(
                {
                    "GIT_AUTHOR_DATE": "2026-07-01T12:00:00+00:00",
                    "GIT_COMMITTER_DATE": "2026-07-01T12:00:00+00:00",
                }
            )
            (repo / "service.py").write_text("value = 1\n")
            run(["git", "add", "service.py"], repo)
            run(["git", "commit", "-m", "add service"], repo, env)

            env.update(
                {
                    "GIT_AUTHOR_DATE": "2026-07-02T12:00:00+00:00",
                    "GIT_COMMITTER_DATE": "2026-07-02T12:00:00+00:00",
                }
            )
            (repo / "service.py").write_text("value = 2\n")
            run(["git", "add", "service.py"], repo)
            run(["git", "commit", "-m", "fix service regression"], repo, env)

            proc = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--repo",
                    str(repo),
                    "--since",
                    "2026-01-01",
                ],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            data = json.loads(proc.stdout)
            rendered = json.dumps(data)

            self.assertEqual(data["schema_version"], "1.1")
            self.assertEqual(data["commit_count"], 2)
            self.assertEqual(data["identity_detail"], "mailmap-aware name only")
            self.assertEqual(
                data["signals"]["file_touch_frequency"][0],
                {"path": "service.py", "touch_count": 2},
            )
            self.assertEqual(
                data["signals"]["fix_keyword_file_associations"][0]["path"],
                "service.py",
            )
            self.assertEqual(
                data["signals"]["contributor_commit_activity"][0]["identity"],
                "Test User",
            )
            self.assertNotIn("test@example.com", rendered)
            self.assertIn("not code risk", " ".join(data["interpretation_limits"]))
            self.assertIn("personality", " ".join(data["interpretation_limits"]))
            self.assertNotIn("bus_factor", rendered)

    def test_contributor_activity_respects_selected_ref(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            run(["git", "init"], repo)
            base_branch = run(["git", "branch", "--show-current"], repo).stdout.strip()

            commit(
                repo,
                "base.py",
                "value = 1\n",
                "add base",
                "Base User",
                "base@example.com",
                "2026-06-01T12:00:00+00:00",
            )
            run(["git", "checkout", "-b", "side"], repo)
            commit(
                repo,
                "side.py",
                "value = 2\n",
                "add side",
                "Side User",
                "side@example.com",
                "2026-06-02T12:00:00+00:00",
            )
            run(["git", "checkout", base_branch], repo)

            proc = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--repo",
                    str(repo),
                    "--ref",
                    base_branch,
                    "--since",
                    "2026-01-01",
                ],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            data = json.loads(proc.stdout)
            identities = [
                row["identity"] for row in data["signals"]["contributor_commit_activity"]
            ]

            self.assertEqual(data["commit_count"], 1)
            self.assertEqual(identities, ["Base User"])
            self.assertNotIn("Side User", json.dumps(data))

    def test_fails_usefully_outside_repository(self):
        with tempfile.TemporaryDirectory() as tmp:
            proc = subprocess.run(
                ["python3", str(SCRIPT), "--repo", tmp],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            self.assertNotEqual(proc.returncode, 0)
            error = json.loads(proc.stderr)
            self.assertEqual(error["status"], "failed")


if __name__ == "__main__":
    unittest.main()
