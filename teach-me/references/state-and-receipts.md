# State and Receipts

Use the learning engine for deterministic dates, queues, state replay, scheduling projections, and statistics. It requires Node.js 18+ and uses only built-in modules; no npm install is required.

## Contents

- [Storage](#storage)
- [Topic input](#topic-input)
- [Stash and isolated assessment](#stash-and-isolated-assessment)
- [Direct review receipt](#direct-review-receipt)
- [Decision-grade milestones](#decision-grade-milestones)
- [Learner-authored references](#learner-authored-references)
- [Grades and scheduling](#grades-and-scheduling)
- [Queues and coaching](#queues-and-coaching)
- [Stateless fallback packet](#stateless-fallback-packet)

## Storage

State defaults to `~/.teach-me/`. Override it with `TEACH_ME_HOME` when isolation or project-local state is needed. Files remain human-readable:

```text
learner.json
topics/<topic>.json
receipts/<topic>.jsonl
scheduler-receipts/<topic>.jsonl
milestones/<topic>.jsonl
references/<topic>/<reference>.json
pending.json
```

Canonical assessment receipts are append-only evidence. Topic node state is compatibility state derived from them and repaired on read. Scheduler receipts are versioned, replayable projections derived from the same canonical evidence. Free learner text must enter through a JSON file or stdin, never a shell argument.

Set `TEACH_ME_TODAY=YYYY-MM-DD` only for deterministic tests.

Use `learning-engine.mjs` as the entry point. It proxies compatibility commands to `learning-state.mjs`, automatically synchronizes scheduler projections after state-changing assessment commands, and owns the authoritative due queue.

## Topic input

Create one file and pass its path to `add-topic`:

```json
{
  "topic": "bayes-for-diagnostics",
  "title": "Bayesian reasoning for diagnostic decisions",
  "goal": "Interpret a positive test result without confusing sensitivity with probability of disease",
  "mission": {
    "why": "Make defensible screening decisions at work",
    "success": ["Explain a positive result to a non-specialist", "Choose when another test is warranted"],
    "constraints": ["Use the team's approved clinical guidance"],
    "out_of_scope": ["Deriving continuous-distribution Bayes factors"]
  },
  "sources": [
    {
      "title": "Approved screening guidance",
      "location": "./guidance/screening.md",
      "use_for": "Operational thresholds and terminology"
    }
  ],
  "source_gaps": ["A primary source for communicating uncertainty"],
  "order": ["base-rate", "bayes-update", "decision"],
  "nodes": {
    "base-rate": {
      "claim": "A test result updates a prior probability rather than replacing it.",
      "probe": "What role does prevalence play after a positive test?",
      "rubric": [
        "identifies prevalence as the prior",
        "states that the test updates rather than discards it"
      ],
      "requires": [],
      "transfer_probe": "A fraud detector flags a payment. What information plays the role of prevalence?",
      "arbitrary": false,
      "threshold": true
    }
  }
}
```

Rules enforced by the helper:

- topic and node ids use lowercase kebab-case;
- every `order` entry has exactly one node and vice versa;
- prerequisites exist, appear earlier, and contain no cycles;
- claims, probes, and rubrics are non-empty;
- mission context is optional, but when present includes `why` and at least one observable `success`;
- optional sources include an annotated `title`, `location`, and `use_for`;
- engine-owned state from the input is ignored and rebuilt from receipts.

Commands:

```bash
node <skill-dir>/scripts/learning-engine.mjs add-topic --file <topic.json>
node <skill-dir>/scripts/learning-engine.mjs topics
node <skill-dir>/scripts/learning-engine.mjs status --topic <topic>
node <skill-dir>/scripts/learning-engine.mjs scheduler-status --topic <topic>
node <skill-dir>/scripts/learning-engine.mjs next --topic <topic>
```

`status --topic` returns the compatibility topic state and source ledger. `scheduler-status --topic` returns the authoritative FSRS memory projection. When revising a graph with `add-topic --replace`, omitted `mission`, `sources`, and `source_gaps` fields retain their existing values; pass `mission: null` or empty source arrays explicitly to clear them.

## Stash and isolated assessment

After a cold production and confidence gate, create a stash input:

```json
{
  "topic": "bayes-for-diagnostics",
  "node": "base-rate",
  "kind": "encode",
  "production": "The original prevalence still matters because the result changes it rather than starting from zero.",
  "confidence": 70,
  "source": "self"
}
```

Then:

```bash
node <skill-dir>/scripts/learning-engine.mjs stash add --file <attempt.json>
node <skill-dir>/scripts/learning-engine.mjs stash list
```

The helper adds the node claim, probe, rubric, timestamp, and an `attempt_id`. Pass the listed item to the assessor.

Settle with an array or one object:

```json
[
  {
    "attempt_id": "a_...",
    "grade": "recalled",
    "rubric_notes": "Both criteria met.",
    "misconceptions": [],
    "feedback_line": "You kept the prior in the update and stated its role.",
    "grader": "isolated-assessor"
  }
]
```

```bash
node <skill-dir>/scripts/learning-engine.mjs settle --file <assessment.json>
```

Settlement is idempotent by `attempt_id`. A retry cannot apply the same canonical receipt twice. Successful settlement also synchronizes any missing scheduler projections and returns a `scheduler_sync` result.

## Direct review receipt

For a routine review graded in the current context, write one receipt input and use `record`:

```json
{
  "receipt_id": "r_unique-id-generated-for-this-attempt",
  "topic": "bayes-for-diagnostics",
  "node": "base-rate",
  "kind": "review",
  "production": "...",
  "confidence": 50,
  "grade": "partial",
  "rubric_notes": "Named prevalence but omitted the update relationship.",
  "misconceptions": ["A positive result replaces the prior."],
  "feedback_line": "Prevalence is present, but the update mechanism is missing.",
  "grader": "tutor",
  "source": "self"
}
```

Generate a safe id before writing the receipt if needed:

```bash
node <skill-dir>/scripts/learning-engine.mjs new-id
node <skill-dir>/scripts/learning-engine.mjs record --file <receipt.json>
```

`record` treats `receipt_id` idempotently and synchronizes the scheduler projection. Use the returned scheduler data or `scheduler-status`; do not infer the next interval from the grade yourself.

## Decision-grade milestones

Milestones preserve sparse interpretations that affect future teaching; they do not replace receipts. Generate an id, then pass one object through a file or stdin:

```bash
node <skill-dir>/scripts/learning-engine.mjs new-id --kind milestone
node <skill-dir>/scripts/learning-engine.mjs milestone add --file <milestone.json>
node <skill-dir>/scripts/learning-engine.mjs milestone list --topic bayes-for-diagnostics
```

```json
{
  "milestone_id": "m_unique-id-generated-for-this-milestone",
  "topic": "bayes-for-diagnostics",
  "kind": "corrected-misconception",
  "summary": "The learner now distinguishes the posterior from test sensitivity.",
  "evidence": "A cold reconstruction correctly retained the prior and likelihood roles.",
  "receipt_ids": ["r_recalled-receipt-id"],
  "implications": ["Future examples can start from odds form rather than re-teaching base rates."],
  "supersedes": []
}
```

Use only `demonstrated-understanding`, `prior-knowledge`, `corrected-misconception`, or `mission-shift`. The first and third kinds require at least one linked `recalled` receipt produced by the learner; a `source: "told"` receipt never qualifies. For `prior-knowledge`, describe the learner's claimed depth in `evidence` and do not imply it was tested. To revise an interpretation, add a new milestone and put an active old milestone id in `supersedes`; never edit the JSONL history or create multiple successors for one milestone.

## Learner-authored references

Save compact Markdown only after the learner has retrieved the underlying knowledge and authored or materially edited the text:

```json
{
  "topic": "bayes-for-diagnostics",
  "reference": "positive-test-checklist",
  "title": "Positive test interpretation checklist",
  "content": "1. Start with prevalence...",
  "authorship": "learner-edited",
  "receipt_ids": ["r_recalled-receipt-id"]
}
```

```bash
node <skill-dir>/scripts/learning-engine.mjs reference add --file <reference.json>
node <skill-dir>/scripts/learning-engine.mjs reference list --topic bayes-for-diagnostics
node <skill-dir>/scripts/learning-engine.mjs reference show --topic bayes-for-diagnostics --reference positive-test-checklist
```

Use only `learner` or `learner-edited` authorship. At least one linked receipt must be learner-produced and `recalled`; a `source: "told"` receipt never qualifies. Revise an existing reference with `reference add --file <reference.json> --replace`; the original `created_at` is preserved. A saved reference never advances scheduling or mastery.

## Grades and scheduling

Use only these rubric grades:

- `recalled`: every rubric criterion is present;
- `partial`: the core is present but required criteria are missing;
- `lapsed`: the core is absent or materially wrong.

The engine maps evidence to scheduler ratings conservatively:

- `recalled` → `good`;
- `partial` → `hard`;
- `lapsed` → `again`;
- `source: "told"` → `hard`, regardless of an optimistic grade;
- `transfer` → no memory transition.

The FSRS-4.5 projection stores per-node stability, difficulty, last review, due date, repetitions, and lapses. Its default policy targets 90% retention with a fixed interval multiplier of 1.0. Per-item state adapts from review history, but the global parameter vector is not fitted to the learner.

Every scheduler projection records the engine version, policy, mapped rating, before-state, after-state, interval, and due date. Run `scheduler-replay` to reproduce transitions and `scheduler-doctor` to detect missing or conflicting projections.

Transfer updates capability evidence but never lowers or reschedules memory state. Node mastery still requires delayed retrieval reaching the compatibility durable stage and any declared transfer probe succeeding; use the FSRS due queue for actual review timing.

Read [memory-engine.md](memory-engine.md) for the full boundary and audit contract.

## Queues and coaching

```bash
node <skill-dir>/scripts/learning-engine.mjs due --limit 10
node <skill-dir>/scripts/learning-engine.mjs due-summary --limit 5
node <skill-dir>/scripts/learning-engine.mjs stats
node <skill-dir>/scripts/learning-engine.mjs misconceptions
node <skill-dir>/scripts/learning-engine.mjs doctor
node <skill-dir>/scripts/learning-engine.mjs scheduler-doctor
node <skill-dir>/scripts/learning-engine.mjs export
```

Interpret statistics conservatively:

- `loop_closure` measures encoded nodes with at least one later review;
- `review_recall` reports outcomes only for attempted reviews and always includes `n`;
- the engine's `memory.due` block is authoritative for currently due work;
- `calibration` is omitted when confidence was not explicitly recorded;
- transfer stays separate from recall;
- thin samples remain counts, not confident strategy claims;
- unsynced scheduler projections are integrity warnings, not learning outcomes.

## Stateless fallback packet

When local state is unavailable, return:

```text
goal:
mission context and constraints:
trusted sources and gaps:
topic and frontier:
claims introduced:
exact productions and grades:
open misconceptions:
transfer evidence:
decision-grade milestones:
learner-authored references:
next reviews (simple fallback dates):
return cue (only if volunteered):
```

Do not claim continuity beyond what the packet preserves. Do not call fallback dates FSRS or personalized scheduling.
