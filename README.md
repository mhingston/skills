# Agent Skills

A catalogue of reusable agent skills for software engineering, learning, workflow
improvement, and accountable AI-assisted delivery.

Each skill lives in its own directory and is defined by a `SKILL.md` file. Some
skills also use supporting material in a local `references/` directory or in the
shared top-level [`references/`](references/) directory.

## Skill catalogue

| Skill | Use it for |
| --- | --- |
| [`adopt`](adopt/SKILL.md) | Compare the current codebase with another project or idea and identify high-value, low-friction patterns worth adapting. |
| [`audit-me`](audit-me/SKILL.md) | Audit recurring work and connected work surfaces for dropped commitments, fragmented context, and automation opportunities. |
| [`coach-me`](coach-me/SKILL.md) | Analyse how a user collaborates with advanced models and produce focused coaching and a personalised AI working manual. |
| [`create-pr`](create-pr/SKILL.md) | Investigate a branch, gather proportionate evidence, assess comprehension risk, and create one reviewable pull request without approving or merging it. |
| [`deep-learning`](deep-learning/SKILL.md) | Turn passive study into active understanding through explanation, retrieval, diagnosis, application, and reinforcement. |
| [`explain-diff`](explain-diff/SKILL.md) | Build a causal, interactive mental model of a diff, commit, branch, or pull request so a reader can reason about and participate in future work. |
| [`git-archaeologist`](git-archaeologist/SKILL.md) | Use repository history to identify ownership patterns, defect hotspots, maintenance risk, and investigation priorities. |
| [`human-verdict-gate`](human-verdict-gate/SKILL.md) | Prepare a revision-specific decision packet for an accountable human without choosing, recording, or implying the verdict. |
| [`record-verdict`](record-verdict/SKILL.md) | Persist an explicitly human-supplied verdict against the exact pull-request revision as a structured, idempotent GitHub record. |
| [`session-lessons`](session-lessons/SKILL.md) | Analyse multiple sessions for recurring friction and effective patterns that deserve durable codification. |

## Human-verdict workflow

The change-review skills are designed to compose rather than collapse into one
large autonomous workflow:

```text
agent implementation and local verification
                    ↓
create-pr — assemble evidence and create the review surface
                    ↓
explain-diff — build a causal mental model when proportionate
                    ↓
human-verdict-gate — prepare the current decision packet
                    ↓
human chooses and explains a verdict
                    ↓
record-verdict — persist the decision against the exact PR revision
```

### `create-pr`: make the change reviewable

Use `create-pr` when a branch is ready to become a pull request. It inspects the
complete change, traces affected behaviour and blast radius, records exact
verification results and limitations, and routes high-comprehension-risk
changes toward a deeper explanation.

It creates evidence, not approval.

### `explain-diff`: make the change understandable

Use `explain-diff` when the reviewer needs more than a concise PR description.
It teaches previous and new behaviour, invariants, data flow, failure modes,
trade-offs, and likely extension points. Its understanding checks and
explain-back prompts are aids to human reflection, not proof of correctness.

### `human-verdict-gate`: make the decision judgeable

Use `human-verdict-gate` immediately before a consequential decision. It
revalidates the current revision, CI and review state, unresolved concerns,
operational readiness, and comprehension evidence. It leaves the explain-back,
risk acceptance, and verdict fields for the accountable human to complete.

### `record-verdict`: make the human decision durable

Use `record-verdict` only after a human has explicitly supplied the decision,
rationale, and accepted risks. It binds the record to the exact PR head SHA and
updates the canonical GitHub comment idempotently. A later commit makes an older
record stale.

`record-verdict` deliberately does not approve, merge, or deploy. Repository
policy may require a current verdict record alongside passing checks and other
controls, but automation must not manufacture the human decision.

## Shared references

The verdict workflow uses shared material in [`references/`](references/):

- [`change-investigation.md`](references/change-investigation.md) — safe,
  causal investigation of a change and its surrounding system;
- [`evidence-discipline.md`](references/evidence-discipline.md) — observed,
  inferred, and unknown claims; evidence limitations; and operational evidence;
- [`comprehension-design.md`](references/comprehension-design.md) —
  comprehension-risk levels, explanation design, quizzes, and explain-back;
- [`verdict-comment-template.md`](references/verdict-comment-template.md) — the
  canonical human-facing and embedded machine-readable GitHub comment;
- [`verdict-record.schema.json`](references/verdict-record.schema.json) — the
  machine-readable contract for a recorded verdict.

## Design principles

1. Evidence is not approval.
2. Explanation is not proof of correctness.
3. Model-generated rationale is not human judgment.
4. A verdict applies only to the exact revision reviewed.
5. Green checks cannot silently replace explicit risk acceptance.
6. Automation may enforce a recorded verdict, but it must not invent one.
7. Use the lightest skill and artefact proportionate to the task and risk.

## Installation and use

Clone the repository or copy the required skill directories into the location
used by your agent harness. Preserve relative paths for skills that depend on
the shared top-level `references/` directory.

For a harness that requires every skill to be self-contained, copy the required
shared references into that skill's own `references/` directory and update the
paths in `SKILL.md`.

Skill support varies between agent products. The Markdown files are intended to
be readable as both executable agent guidance and reviewable process
documentation.
