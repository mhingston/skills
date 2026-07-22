---
name: human-verdict-gate
description: >-
  Internal PR-review decision-packet module. Use only after the pr-review agent
  has pinned the current head SHA, obtained a current technical review and risk
  map with reviewer provenance, resolved every upstream design redirect,
  established the review frame, and completed any required explain-diff stage.
  Prepare the human decision packet without choosing or recording a verdict.
metadata:
  mhingston.internal: "true"
  mhingston.owner-agent: "pr-review"
  mhingston.user-invocable: "false"
compatibility: Requires read-only access to the current decision surface and a writable artefact directory supplied by the pr-review agent.
---

# Human Verdict Gate

Prepare the revision-specific evidence and unanswered questions an accountable human needs
to make a decision. Evidence, technical dispositions, reviewer topology, and packet
readiness are not a human verdict.

## Invocation contract

Run only when `pr-review` supplies:

- exact repository, pull-request or equivalent decision-surface identity;
- pinned base and head revisions;
- approved review frame and current change evidence;
- current technical review and revision-bound risk map schema version 2 or later;
- reviewer provenance and material correlation limitations;
- confirmation that `design_redirects` contains no unresolved entry;
- a current explainer when comprehension risk is moderate or high;
- applicable policy, specialist requirements, accountable authority, and
  `ARTIFACT_DIRECTORY`.

If invoked directly or before these inputs exist, do not inspect or prepare a packet.
Return `REQUIRED_ORCHESTRATOR_CONTEXT` and direct the caller to `pr-review`.

This module never approves, merges, deploys, comments on the pull request, or records a
verdict. It must not draft, prefill, paraphrase into first person, or suggest the human's
explain-back, risk acceptance, rationale, conditions, or verdict.

## Fail-closed design boundary

Before any other work, inspect the current risk map and orchestration state.

If any design redirect is unresolved, return `DESIGN_DECISION_REQUIRED` with its IDs,
missing decisions, required authority, required artifacts, and exact resume evidence. Do
not create a verdict packet and do not convert the redirect into an ordinary material-risk
disposition.

A violation of an existing ADR, policy, contract, or explicit architecture decision is not
a design redirect. It remains a technical or specification finding and may proceed through
the ordinary risk-disposition process.

## Evidence and risk discipline

Classify material claims as `observed`, `inferred`, or `unknown`. For each claim, record its
evidence, result, limitation, and whether it is fresh for the pinned revision. Passing
checks establish only the risks and behaviours they exercise.

For every material mapped risk preserve:

- identifier, review dimension, failure mode, and affected boundary;
- exact evidence;
- severity, likelihood, and confidence as separate values;
- policy threshold and result, or `no-policy`;
- agent-proposed technical disposition;
- specialist requirement and unresolved verification;
- detection, containment, rollback, and compound-risk relationships.

The human must explicitly dispose every material risk as one of:

- `remediated`;
- `accepted`;
- `accepted-with-conditions`;
- `deferred-and-tracked`;
- `rejected-as-unsupported`;
- `redirected`;
- `blocked-pending-evidence`;
- `blocked-pending-specialist-review`.

`redirected` applies to a human decision about an ordinary mapped risk. It must not be used
to bypass the upstream `DESIGN_REDIRECT_REQUIRED` state.

Do not convert an agent disposition, policy threshold, green check, low posture, review
state, calibration proposal, or silence into human acceptance.

## Reviewer-provenance discipline

Preserve the supplied provenance rather than summarising it as `independent review`.
Include:

- execution mode and context separation;
- known model and model-family identifiers;
- shared prompt family, originating context, evidence packet, tools, and retrieval limits;
- whether authoring and reviewing models were reused, when known;
- falsifier context, model/specialist diversity, and deterministic evidence;
- material correlation limitations and unknown provenance fields.

Do not downgrade packet readiness solely because reviewers are correlated. Instead state
which assumptions are shared, what consequential evidence remains uncovered, and whether
policy or consequence risk requires heterogeneous or specialist review.

## Workflow

### 1. Resolve and pin the decision surface

Read current pull-request metadata, diff, checks, reviews, comments, unresolved threads,
CODEOWNERS, and repository policy using read-only tools. Record repository, item number,
base SHA, exact head SHA, state, and latest material update.

Stop with `STALE_DECISION_SURFACE` if the current head differs from the supplied head or
changes during investigation.

### 2. Validate supplied artefacts

Read the technical review, risk map, and required explainer. Require:

- matching repository, scope, base SHA, and current head SHA;
- documented execution mode, dimensions, reviewer provenance, coverage, limitations, and
  technical posture;
- validated findings separated from unverified concerns;
- falsification evidence for validated findings;
- one risk-map entry for every material finding and unknown;
- no unresolved design redirect;
- no model-generated human verdict or accepted-risk statement.

Verify material cited paths and evidence against the current change. Return
`INSUFFICIENT_EVIDENCE` for missing, malformed, or unsupported technical artefacts,
`DESIGN_DECISION_REQUIRED` for unresolved redirects, and
`INSUFFICIENT_COMPREHENSION_EVIDENCE` for a missing or stale required explainer.

### 3. Reconstruct the decision frame

State the problem, desired outcome, approved acceptance criteria, non-goals, constraints,
reversibility, design evidence relied upon, and authority required to accept each category
of residual risk. Distinguish human-provided requirements from inference and expose
conflicts among tickets, briefs, policy, implementation, architecture artefacts, and review
evidence.

### 4. Reinspect the current change

Do not merely reuse the pull-request description. Trace the current diff through relevant
callers, contracts, persistence, messaging, configuration, trust boundaries, retries,
ordering, concurrency, error handling, observability, and tests.

Build a causal change map:

| Area or stage | Behavioural change | Evidence | Boundary | Risk or unknown |
| --- | --- | --- | --- | --- |

Never fabricate dependency edges, paths, symbols, line numbers, or owners.

### 5. Assemble decision-relevant evidence

For each check or artefact, state the exact command or source, result, risk it covers,
limitation, and revision freshness. Surface required failures, optional checks not run,
untested behaviours, conflicting evidence, and evidence sharing the implementation's
assumptions.

Summarise unresolved review threads, requested changes, triggered thresholds, specialist
input, accountable authority, rollout, compatibility, migration, detection, containment,
rollback, blast radius, and operational ownership. Mark missing information `unknown`.

### 6. Challenge the work

Include only plausible, consequential challenges:

- strongest technical case against proceeding;
- requirement most likely to have been misunderstood;
- what could pass current checks and still be wrong;
- weakest-investigated boundary or correlated assumption;
- evidence most likely to change the decision;
- specialist question still unanswered;
- hidden complexity, scope expansion, or upstream decision already resolved by cited
  design evidence but implemented inconsistently.

### 7. Assess the four review functions

Evaluate each function independently and cite evidence plus limitations.

#### Correctness evidence

Use one status:

- `current` — proportionate technical evidence applies to the exact revision;
- `limited` — current evidence exists but named behaviours or boundaries remain weakly
  tested or inspected;
- `missing` — required correctness evidence is absent or stale.

#### Knowledge transfer

Use one status:

- `sufficient` — the packet and current explainer support a causal understanding
  proportionate to comprehension risk;
- `explanation-required` — a specific runtime path, invariant, or failure interaction still
  requires explanation;
- `missing` — the human cannot form a proportionate mental model from current evidence.

#### Risk visibility

Use one status:

- `complete` — material supported risks and unknowns are visible and revision-bound;
- `material-unknowns` — named consequential unknowns remain for explicit disposition;
- `missing` — the risk map is incomplete, stale, or structurally invalid.

#### Distributed accountability

Use one status:

- `owner-identified` — accountable verdict authority and required specialist/design
  authorities are identified;
- `authority-missing` — one or more required authorities are unknown or unavailable;
- `missing` — no accountable owner can be established.

A strong result in one function cannot compensate for a missing result in another. In
particular, risk visibility does not prove knowledge transfer, and technical evidence does
not create accountable authority.

### 8. Determine packet readiness

Use exactly one status:

- `READY_FOR_HUMAN_VERDICT` — sufficient current evidence exists for a human to decide; no
  recommendation is made.
- `READY_WITH_MATERIAL_UNKNOWNS` — named unknowns require explicit human disposition,
  conditions, specialist input, or blocking.
- `DESIGN_DECISION_REQUIRED`.
- `INSUFFICIENT_EVIDENCE`.
- `INSUFFICIENT_COMPREHENSION_EVIDENCE`.
- `STALE_DECISION_SURFACE`.
- `MISSING_AUTHORITY`.

Return `INSUFFICIENT_EVIDENCE` when correctness evidence or risk visibility is `missing`.
Return `INSUFFICIENT_COMPREHENSION_EVIDENCE` when knowledge transfer is `missing` or still
requires an unavailable explainer. Return `MISSING_AUTHORITY` when distributed
accountability is `authority-missing` or `missing` and the missing authority is required to
decide.

These statuses describe packet readiness, not approve/block/merge decisions.

## Decision-packet contract

Save a Markdown packet under `ARTIFACT_DIRECTORY`, using a name such as
`YYYY-MM-DD-pr-123-human-verdict-packet.md`.

Include:

1. decision surface and exact revisions;
2. packet status, technical posture, consequence risk, comprehension risk, and evidence
   freshness;
3. four-function coverage table with status, evidence, and limitation;
4. reviewer provenance and material correlation limitations;
5. decision frame, resolved design evidence, and required authority;
6. before/after behaviour and causal change map;
7. complete material risk map, compound risks, and specialist requirements;
8. claim/evidence/result/limitation/freshness table;
9. unresolved reviews, policy thresholds, and operational readiness;
10. strongest case against proceeding and evidence gaps;
11. links to the technical review, risk map, and explainer;
12. unanswered human decision section.

The human section must contain empty fields for:

- accountable owner and verdict;
- explanation in the human's own words;
- most credible failure mode, detection, and containment or rollback;
- evidence relied upon and its limitations;
- disposition and rationale for every material risk;
- residual risk, rationale, conditions, specialist input, and review point.

Do not provide suggested answers.

## Validation and return

Before returning:

1. Recheck the current head SHA.
2. Confirm every artefact and claim applies to that revision.
3. Confirm no unresolved design redirect exists.
4. Confirm every material risk appears exactly once in the packet.
5. Confirm all four review-function statuses are present and evidence-backed.
6. Confirm reviewer provenance is preserved without overstating independence.
7. Confirm no human field is prefilled or implied.
8. Confirm the packet path is inside the supplied artefact directory.

Return packet path or link, exact revision, packet status, technical posture, four-function
coverage, provenance limitations, material-risk count, unknowns, missing authority or
specialist input, and confirmation that no verdict or repository mutation was performed.