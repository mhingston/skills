# Memory Engine

The learning engine makes review scheduling deterministic and replayable. The tutor supplies evidence; code owns memory state.

## Boundary

`learning-engine.mjs` wraps `learning-state.mjs` rather than replacing its evidence model.

- `learning-state.mjs` owns topics, prerequisite graphs, pending productions, canonical assessment receipts, milestones, learner-authored references, and compatibility state.
- `learning-engine.mjs` proxies those commands, projects FSRS-4.5 memory state from canonical receipts, appends versioned scheduler projections, and exposes the authoritative due queue.
- The tutor never computes a due date, stability value, difficulty value, retrievability estimate, or interval.

Canonical assessment receipts remain the source of truth. Scheduler records are reproducible projections, not independent claims of learning.

## Commands

```bash
node <skill-dir>/scripts/learning-engine.mjs version
node <skill-dir>/scripts/learning-engine.mjs due --limit 20
node <skill-dir>/scripts/learning-engine.mjs due-summary --limit 5
node <skill-dir>/scripts/learning-engine.mjs scheduler-status --topic <topic>
node <skill-dir>/scripts/learning-engine.mjs scheduler-replay --topic <topic>
node <skill-dir>/scripts/learning-engine.mjs scheduler-sync
node <skill-dir>/scripts/learning-engine.mjs scheduler-doctor
node <skill-dir>/scripts/learning-engine.mjs export
node <skill-dir>/scripts/learning-engine.mjs selftest
```

All other commands are passed to the compatibility helper. Successful `init`, `add-topic`, `record`, and `settle` calls automatically run a scheduler sync.

## Evidence-to-rating policy

Assessment and scheduling are separate decisions:

| Assessment receipt | Scheduler rating |
|---|---|
| `lapsed` | `again` |
| `partial` | `hard` |
| `recalled` | `good` |
| any receipt with `source: "told"` | `hard` |
| `transfer` | no memory transition |

The tutor must not use `easy` merely because an answer was fluent or highly confident. Confidence is calibration evidence, not a scheduling grade. The engine accepts an explicit future `scheduler_rating`, but current helper receipts do not preserve one; the conservative mapping above is therefore authoritative.

## FSRS state

Each memory-bearing receipt updates one node projection:

```json
{
  "stability": 8.412,
  "difficulty": 4.928,
  "last": "2026-07-21",
  "due": "2026-07-30",
  "reps": 2,
  "lapses": 0
}
```

The engine uses the FSRS-4.5 default parameter vector, desired retention `0.90`, a fixed interval multiplier of `1.0`, and a maximum interval of 365 days. These policy values are stamped into every scheduler projection.

Per-item stability and difficulty adapt immediately from the learner's review history. That is not the same as fitting global FSRS parameters to the learner. Do not claim user-level optimization unless a later engine version introduces a guarded fitting policy with enough delayed-review evidence.

## Versioned scheduler receipts

Scheduler projections are appended under:

```text
~/.teach-me/scheduler-receipts/<topic>.jsonl
```

Each row contains:

```json
{
  "projection_id": "1.0.0:r_receipt_id",
  "engine_version": "1.0.0",
  "scheduler": "fsrs-4.5",
  "receipt_id": "r_receipt_id",
  "rating": "good",
  "before": null,
  "after": {
    "stability": 3.7145,
    "difficulty": 5.1618,
    "interval_days": 4,
    "due": "2026-07-21"
  }
}
```

`projection_id` includes the engine version. A future engine can append a new projection for the same canonical receipt without rewriting old audit history.

`projected_at` is informational and ignored during deterministic comparison. Every other field must match replay. `scheduler-doctor` reports missing projections as warnings and conflicting projections as errors.

## Replay and integrity

The current schedule is rebuilt by sorting canonical receipts by timestamp and original file order, then replaying every memory-bearing transition. This means:

- topic state can be recovered after derived files are deleted;
- scheduler arithmetic can be tested independently of the tutor;
- a changed engine version can be compared with earlier projections;
- hand-edited or corrupt receipts are surfaced instead of silently guessed around.

Run:

```bash
node <skill-dir>/scripts/learning-engine.mjs scheduler-doctor
```

before trusting statistics after an upgrade, manual state edit, interrupted migration, or unexpected due queue.

## Due summary contract

`due-summary` is the only interface platform hooks need:

```json
{
  "total_due": 3,
  "silent": false,
  "message": "3 reviews due",
  "items": []
}
```

When no reviews are due:

```json
{
  "total_due": 0,
  "silent": true,
  "message": null,
  "items": []
}
```

Adapters must remain silent when `silent` is true. They must not create reviews, modify state, or reinterpret due dates.

## Export and recovery

`export` emits a self-contained JSON snapshot containing learner metadata, topics, canonical receipts, and current scheduler transitions. It is suitable for backup, inspection, or migration design. It does not mutate state.

The canonical recovery order is:

1. restore `learner.json`, topic files, canonical receipt JSONL, milestones, references, and pending stash;
2. run `scheduler-sync`;
3. run `doctor`;
4. inspect the due queue before continuing.

## Limitations

- The first release deliberately avoids global parameter fitting.
- Cross-device continuity requires the state directory to be synchronized by infrastructure outside this skill.
- Automatic session-start notifications require a platform hook, scheduled task, or equivalent adapter.
- The compatibility topic files still contain legacy fixed-ladder derived state. Use the learning engine's due and scheduler commands for memory decisions.
