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
