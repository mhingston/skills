---
name: refine-ticket
description: >-
  Internal refine-agent module for assessing and drafting one bounded,
  agent-ready work item. Use only when the refine agent supplies a source
  snapshot, orchestration state, tracker capabilities, and settled constraints.
metadata:
  mhingston.internal: "true"
  mhingston.owner-agent: "refine"
  mhingston.user-invocable: "false"
---

# Refine Ticket

Assess one bounded work item against a portable readiness contract and return a
durable proposed rewrite to the `refine` agent.

## Invocation contract

Run this module only when `refine` supplies all of:

- `refine_agent_state`, equal to `REFINE_SINGLE` or `REFINE_CHILDREN`;
- a complete source snapshot or proposed child draft;
- the source version when a live tracker item exists;
- issue type and tracker capabilities;
- settled shared constraints, decisions, and non-goals.

If invoked directly or without this context, do not inspect repositories, ask
refinement questions, draft a ticket, or write to a tracker. Return
`REQUIRED_ORCHESTRATOR_CONTEXT` and direct the caller to the `refine` agent.

This module never mutates the tracker. Return its assessment, next question, or
proposed rewrite to `refine`, which owns human interaction, approval, mutation,
and verification.

## Readiness source

Read [`references/readiness-rubric.yml`](references/readiness-rubric.yml) before
assessing or drafting a ticket. Treat it as authoritative.

Validate before use:

- `hardGates` and `conditionalGates` are non-empty;
- every gate has a unique `id`, `label`, and non-empty `passWhen`;
- every conditional gate also has non-empty `appliesWhen` and `skipWhen`.

Return `INVALID_READINESS_RUBRIC` if validation fails. Do not silently add,
remove, or reinterpret gates during a run.

## Evidence discipline

Use the supplied source, comments, parent decisions, and observed repository
context. Distinguish observed facts, inferences, and unknowns. When repository
context is available, check the relevant behaviour, domain language, stable
interfaces, tests, and ADRs read-only.

Do not invent product intent or promote a plausible implementation into a
requirement. Do not require a specific file layout, function body, or line
number. Stable public names, schemas, events, invariants, and behavioural seams
are appropriate when they materially constrain the work.

## 1. Confirm that the item is bounded

Return `NEEDS_DECOMPOSITION` when the item contains multiple independently
valuable or verifiable outcomes, cannot reasonably fit a fresh agent context,
or has a dependency graph hidden inside it. Explain the distinct outcomes to
the orchestrator; do not split them here.

Remain in this module when multiple symptoms share one behavioural cause and one
acceptance boundary.

## 2. Shape the ticket by work type

Use the source's semantics, not only its tracker label.

- **Bug** — capture reproducible or otherwise observable evidence, actual and
  expected behaviour, relevant environment, frequency, and error information.
- **Story or enhancement** — capture actor, goal, value, current experience,
  desired outcome, and constraints.
- **Task or technical debt** — capture current state, desired state, why the
  change matters now, and behaviour that must remain unchanged.
- **Investigation or spike** — capture the question, evidence or systems to
  inspect, time or scope boundary, required output, and the decision that output
  must enable. Completion criteria replace implementation acceptance criteria.

If the type remains materially ambiguous, return one question to `refine`.

## 3. Assess readiness

Evaluate every hard gate as `pass`, `partial`, `fail`, or `unknown`, with a
one-line reason tied to `passWhen` and supporting evidence.

Evaluate a conditional gate only when `appliesWhen` is true. Record it as:

- `pass` when the ticket meets `passWhen`;
- `fail` or `unknown` when applicable information is missing;
- `not_applicable` only when `skipWhen` is met, with the concrete reason.

No numeric total can override a failed hard gate. The ticket is `READY` only
when all hard gates pass and every applicable conditional gate passes or is
deliberately not applicable with a reason.

## 4. Fill material gaps

For the highest-value unresolved gate, return exactly one refinement prompt to
the orchestrator containing:

1. gate ID and label;
2. why current evidence is insufficient;
3. one concrete proposed wording or a focused question;
4. the answer shape needed to pass the gate.

Prefer resolving product behaviour, scope, acceptance, and blockers before
conditional technical enrichment. Reject vague language such as `make it
better`, `it should work`, or `improve performance` without a measured target.

Do not ask the user directly and do not bundle unrelated gates. Reassess after
the orchestrator supplies each answer.

## 5. Draft a durable rewrite

Produce the shortest complete structure appropriate to the item. Prefer these
headings when relevant; omit empty headings:

```markdown
## Problem

## Why it matters

## Desired outcome

## Acceptance criteria

## Verification

## Constraints

## Out of scope
```

For bugs, replace or supplement `Problem` with `Actual behaviour`, `Expected
behaviour`, and `Steps to reproduce` when that is clearer. For investigations,
use `Question`, `Evidence to inspect`, `Required output`, and `Decision enabled`.

Writing rules:

- Start from behaviour people or systems can observe.
- Keep rationale separate from the proposed mechanism.
- Make every acceptance criterion independently verifiable.
- State error, empty, boundary, and compatibility behaviour when relevant.
- Preserve approved parent decisions and shared terminology.
- Name affected domains, services, or stable interfaces without prescribing
  fragile file paths or line-by-line implementation.
- Put applicable architecture, interface, state, invariant, data, rollout,
  security, privacy, and performance constraints in the relevant section.
- State explicit non-goals that prevent plausible adjacent work.
- Do not add a detailed implementation plan or a generic `Tech notes` section.

## Return packet

Return exactly one of these statuses to `refine`:

- `READY` — include source version, complete gate assessment, deliberate
  exclusions, proposed summary, complete proposed body, and preserved fields;
- `NEEDS_INPUT` — include the current assessment and one refinement prompt;
- `NEEDS_DECOMPOSITION` — include the independent outcomes that make one ticket
  unsafe;
- `BLOCKED` — include missing evidence or capability and the recovery action;
- `INVALID_READINESS_RUBRIC`.

Before returning `READY`, confirm the summary is specific, the body stands alone
without conversation context, no hard gate is incomplete, no conditional skip
lacks a reason, and no implementation preference is presented as settled unless
the human or canonical evidence settled it.
