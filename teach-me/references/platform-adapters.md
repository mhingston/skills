# Platform Adapters

The skill is complete without hooks. Adapters only surface the engine's existing due state; they do not own pedagogy, evidence, or scheduling.

## Stable interface

Use:

```bash
node <skill-dir>/scripts/learning-engine.mjs due-summary --limit 5
```

An adapter may display `message` and a compact topic breakdown when `silent` is false. It must do nothing when `silent` is true.

## Adapter invariants

- Read-only: never write receipts or learner state.
- Quiet by default: no notification when nothing is due.
- One nudge per platform session unless the learner asks for reminders.
- No guilt, streak, debt, or urgency language.
- Link or point back to the normal Review mode rather than implementing a second review workflow.
- Do not calculate due dates independently.
- Treat command failure as an adapter failure, not as evidence that nothing is due.

## Session-start hook

A session-start integration can run `due-summary` and inject a single line such as:

```text
[teach-me] 4 reviews due across 2 topics — start Review mode when useful.
```

Do not include the answer, claim, rubric, or full probe in ambient context. The actual Review mode should load the due queue and show one probe at a time.

## Scheduled task

A cron job, Windows Scheduled Task, or automation runner may invoke the same command. Keep the task read-only and route the result to a notification surface chosen by the learner.

Example shell guard:

```bash
summary="$(node /path/to/teach-me/scripts/learning-engine.mjs due-summary --limit 5)" || exit 1
node -e '
  const value = JSON.parse(process.argv[1]);
  if (!value.silent) process.stdout.write(`${value.message}\n`);
' "$summary"
```

The scheduled task should not repeatedly notify about the same backlog unless the learner explicitly requested repeated reminders.

## Cross-platform state

The default state directory is local. Sharing a schedule across coding agents or machines requires external synchronization of `~/.teach-me/` or a configured `TEACH_ME_HOME`.

A synchronization layer must preserve:

- append-only JSONL ordering;
- file contents without conflict-marker insertion;
- permissions appropriate for learner data;
- atomic replacement of JSON files;
- one writer at a time, or conflict-safe serialization.

General-purpose file synchronization can produce duplicate or reordered JSONL during concurrent writes. Prefer one active writer or a repository/database workflow that serializes changes.

## Unsupported implication

Installing the skill alone does not guarantee ambient notifications. That capability belongs to the host platform. The portable promise is narrower and testable: every host capable of running Node.js can query the same deterministic due summary.
