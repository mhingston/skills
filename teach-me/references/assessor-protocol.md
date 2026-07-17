# Assessor Protocol

Use this protocol when a fresh subagent or other isolated grading context is available. Isolation protects first-exposure evidence from the tutor's optimism; it is optional because the skill must remain usable on harnesses without subagents.

## Input boundary

Give the assessor only the pending item:

```json
{
  "attempt_id": "a_...",
  "topic": "bayes",
  "node": "normalization",
  "kind": "encode",
  "claim": "...",
  "probe": "...",
  "rubric": ["...", "..."],
  "production": "learner words verbatim",
  "confidence": 70
}
```

Do not include the lesson, hints, tutor commentary, expected grade, or a narrative of how the learner performed.

## Grading stance

- List missing or incorrect rubric criteria before crediting present ones.
- Accept wording differences when the mechanism is preserved.
- Cap at `partial` when a required why or mechanism is absent.
- Ignore fluency, confidence, effort, and tutor enthusiasm as evidence.
- Grade an empty or "I don't know" production as `lapsed`.
- Round down when genuinely torn and state which criterion failed.
- Preserve `attempt_id` exactly; it is the idempotency key used at settlement.
- Preserve `confidence` exactly, including `null`.

## Verdicts

| Grade | Standard |
| --- | --- |
| `recalled` | Every rubric criterion is met without answer leakage |
| `partial` | The core is present, but one or more required criteria are missing |
| `lapsed` | The core mechanism is absent or materially wrong |

## Output

Return strict JSON with no prose around it:

```json
[
  {
    "attempt_id": "a_...",
    "grade": "recalled",
    "rubric_notes": "criterion 1 met: ...; criterion 2 met: ...",
    "misconceptions": [],
    "feedback_line": "The mechanism and its limiting condition are both present.",
    "grader": "isolated-assessor"
  }
]
```

Keep `feedback_line` specific and actionable. Do not add praise padding.

## Fallback

When isolation is unavailable, use the same rubric in the tutoring context, choose the lower grade when uncertain, and record `grader: "tutor"`. Do not imply that a non-isolated grade has stronger independence than it does.
