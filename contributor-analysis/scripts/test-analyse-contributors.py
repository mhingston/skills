#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("analyse-contributors.py")


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


def commit_file(
    repo: Path,
    path: str,
    content: str,
    message: str,
    name: str,
    email: str,
    date: str,
) -> None:
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


class AnalyseContributorsTests(unittest.TestCase):
    def test_collects_name_only_contributor_and_area_signals(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            run(["git", "init"], repo)

            commit_file(
                repo,
                "src/api/service.py",
                "value = 1\n",
                "add service",
                "Alice Example",
                "alice@example.com",
                "2026-05-01T12:00:00+00:00",
            )
            commit_file(
                repo,
                "src/api/client.py",
                "value = 1\n",
                "add client",
                "Bob Example",
                "bob@example.com",
                "2026-05-02T12:00:00+00:00",
            )
            commit_file(
                repo,
                "src/api/service.py",
                "value = 2\n",
                "fix customer lookup",
                "Alice Example",
                "alice@example.com",
                "2026-05-03T12:00:00+00:00",
            )
            commit_file(
                repo,
                "package-lock.json",
                '{"lockfileVersion": 3}\n',
                "refresh dependencies",
                "Dependency Bot[bot]",
                "bot@example.com",
                "2026-05-04T12:00:00+00:00",
            )

            proc = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--repo",
                    str(repo),
                    "--since",
                    "2026-01-01",
                    "--exclude",
                    "package-lock.json",
                ],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            data = json.loads(proc.stdout)
            rendered = json.dumps(data)

            self.assertEqual(data["commit_count"], 3)
            self.assertEqual(data["evidence_frame"]["identity_detail"], "mailmap-aware name only")
            self.assertEqual(data["contributors"][0]["name"], "Alice Example")
            self.assertEqual(data["contributors"][0]["commit_count"], 2)
            self.assertEqual(data["contributors"][0]["active_months"], 1)
            self.assertEqual(data["contributors"][0]["top_areas"][0]["area"], "src/api")

            area = data["areas"][0]
            self.assertEqual(area["area"], "src/api")
            self.assertEqual(area["change_commits"], 3)
            self.assertEqual(area["unique_contributors"], 2)
            self.assertEqual(area["top_contributor_share"], 0.6667)

            self.assertNotIn("alice@example.com", rendered)
            self.assertNotIn("bob@example.com", rendered)
            self.assertNotIn("fix customer lookup", rendered)
            self.assertNotIn("Dependency Bot", rendered)
            self.assertIn("not productivity", " ".join(data["interpretation_limits"]))

    def test_path_scope_limits_the_evidence_frame(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            run(["git", "init"], repo)

            commit_file(
                repo,
                "src/service.py",
                "value = 1\n",
                "add service",
                "Alice Example",
                "alice@example.com",
                "2026-06-01T12:00:00+00:00",
            )
            commit_file(
                repo,
                "docs/guide.md",
                "guide\n",
                "add guide",
                "Bob Example",
                "bob@example.com",
                "2026-06-02T12:00:00+00:00",
            )

            proc = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--repo",
                    str(repo),
                    "--since",
                    "2026-01-01",
                    "--path",
                    "src",
                ],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            data = json.loads(proc.stdout)

            self.assertEqual(data["commit_count"], 1)
            self.assertEqual(data["evidence_frame"]["paths"], ["src"])
            self.assertEqual([row["name"] for row in data["contributors"]], ["Alice Example"])
            self.assertEqual(data["areas"][0]["area"], "src")

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
