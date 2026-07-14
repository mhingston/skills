# Session Lessons — Destination Routing

This reference determines where a mature candidate should be codified.

Apply routing only after:

1. observations have been deduplicated;
2. the pattern has been validated across sessions;
3. contradictory evidence has been considered;
4. existing coverage has been checked.

## Routing Principles

Prefer, in order:

1. correcting existing guidance;
2. extending the most specific existing source;
3. creating a new durable source only when no suitable source exists;
4. tracking implementation work when documentation alone cannot solve the problem;
5. taking no action when coverage is adequate or evidence is insufficient.

Choose one primary destination.

Secondary validation work may accompany the recommendation.

## Decision Tree

```text
Is this an explicit durable user preference?
  YES → user directives

Is it a short repository-wide convention, invariant, or guardrail?
  YES → agent instructions

Is it detailed domain, architecture, environment, or troubleshooting knowledge?
  YES → repo docs

Does an existing skill cover the same operator intent or decision domain?
  YES → existing skill

Is it a distinct repeatable operator workflow with stable triggers and outputs?
  YES → new skill

Does solving it require implementation, investigation, ownership, or scheduling?
  YES → tracked work item

Is existing coverage adequate, the issue resolved, or evidence insufficient?
  YES → no-op or watchlist
```

The questions are evaluated in context. A candidate may satisfy more than one condition; select the destination that should own the canonical guidance.

## `user directives`

Route here when:

- the user explicitly stated a durable behavioural preference;
- the preference applies across sessions or projects;
- the instruction affects how the agent should work rather than how the repository works;
- the wording can be captured without inference.

Examples:

- prefer managed scraping services over maintaining browser automation;
- do not create files without first showing the proposed structure;
- use a particular work-management system for a class of tasks.

Do not route here when:

- the preference was inferred;
- the statement applied only to one immediate task;
- the instruction is a repository convention;
- the preference belongs in a product requirement or tracked work item.

### Evidence Requirement

One explicit directive may be sufficient when the user clearly states that it should apply going forward.

Repeated explicit directives increase confidence but are not mandatory.

Quote or closely paraphrase the directive and preserve its intended scope.

## `agent instructions`

Route here when the pattern is:

- a repository-wide invariant;
- a short architectural constraint;
- a naming or placement convention;
- a validation requirement relevant to most agent work;
- a guardrail that should be visible before implementation begins.

The concrete destination may be `AGENTS.md` or another agent-instruction file used by the project.

Good examples:

```text
Run generated migrations against the local database before opening a pull request.

Do not modify generated clients directly; regenerate them from the schema.

Use the repository task runner rather than invoking package scripts individually.
```

Do not place long procedures, troubleshooting matrices, or detailed examples in agent instruction files.

Instead:

1. add the concise invariant to the agent instructions;
2. link to the detailed repository documentation.

### Existing Rule

Update an existing rule when it owns the same concept.

Do not create multiple overlapping rules with slightly different wording.

## `repo docs`

Route here when the pattern contains detailed knowledge about:

- architecture;
- deployment;
- testing;
- environments;
- APIs;
- data models;
- configuration;
- troubleshooting;
- service-specific behaviour;
- operational procedures.

Set `destination_detail` to the most specific existing document.

Examples:

```text
docs/development/local-environment.md
docs/testing/contract-tests.md
docs/infrastructure/cloud-environments.md
docs/runbooks/replay-failed-events.md
docs/architecture/decisions/0042-event-versioning.md
```

Propose a new document only when no existing document has clear ownership.

Follow repository naming and information-architecture conventions.

### Decision Records

Use an architecture or decision record when the lesson captures:

- a decision with alternatives and trade-offs;
- a constraint likely to be questioned later;
- a choice that affects multiple components;
- the rationale behind a non-obvious approach.

Do not use a decision record for ordinary troubleshooting instructions.

## `existing skill`

Route here when a current skill addresses the same operator intent but failed because of:

- a narrow or inaccurate trigger description;
- missing should-trigger or should-not-trigger cases;
- incomplete workflow instructions;
- a missing edge case;
- missing validation or recovery steps;
- an absent example;
- unclear tool selection;
- stale references.

Set `destination_detail` to the existing skill path.

### Where to Change the Skill

Update the skill frontmatter or primary `SKILL.md` when the issue affects:

- discoverability;
- trigger conditions;
- fundamental workflow order;
- behavioural boundaries;
- core output contract.

Use `references/` when the missing content is:

- detailed technical guidance;
- a long decision table;
- examples;
- troubleshooting;
- destination-specific procedures.

Use `examples/` when the gap is primarily demonstrative.

Use tests or eval fixtures when the problem is a regression in triggering or execution.

A recommendation may include more than one file, but one file should remain the canonical owner.

### Validation Follow-Up

For trigger or workflow failures, normally recommend:

- a positive trigger eval;
- a negative trigger eval;
- a regression case derived from the observed session;
- verification against several differently worded prompts.

Do not copy sensitive transcript content into fixtures.

## `new skill`

Route here only when all of the following are true:

- the workflow is repeatable;
- the operator intent is distinct;
- trigger conditions can be stated clearly;
- inputs and outputs are stable;
- the workflow involves meaningful reasoning or tool orchestration;
- no existing skill has a natural ownership claim;
- cross-session evidence satisfies the promotion threshold.

A workflow should not become a skill merely because it occurred several times.

Prefer documentation or an agent instruction when the solution is simply:

- remember one fact;
- run one fixed command;
- follow one repository convention;
- read an existing document.

### New-Skill Evidence Threshold

Normally require:

```text
at least 3 distinct sessions
and
at least 2 independent contexts
```

Two sessions may be sufficient for:

- a deterministic high-impact failure;
- a highly reusable workflow with an explicit operator request;
- a workflow required across several repositories;
- a safety or compliance guardrail.

State why the lower threshold is justified.

### New-Skill Contract Check

Before recommending a new skill, define:

```text
intent
triggers
non-triggers
inputs
workflow
tools
outputs
failure_handling
validation
ownership_boundary
```

If these cannot yet be defined, route to a tracked work item or watchlist instead.

## `tracked work item`

Route here when solving the pattern requires:

- implementation work;
- tool or platform changes;
- new automation;
- investigation;
- cross-team agreement;
- prioritisation;
- migration;
- ownership assignment;
- a change too large or uncertain for immediate codification.

The concrete destination should follow the operator's available tooling and conventions. It may be an issue, ticket, task, backlog item, project card, or equivalent.

Examples:

- the session store does not capture the metadata needed for longitudinal analysis;
- a skill trigger engine requires implementation changes;
- repeated failures reveal a missing repository tool;
- documentation exists but is not loaded into agent context;
- several skills duplicate logic and need consolidation.

### Work-Item Recommendation

Set `destination_detail` to a concise proposed summary.

Include:

- observed problem;
- cross-session evidence;
- why documentation alone is insufficient;
- expected outcome;
- acceptance or validation criteria.

The skill does not create the work item automatically.

## `no-op`

Route here when:

- coverage is adequate and discoverable;
- the observation was caused by an isolated local condition;
- the candidate has insufficient evidence;
- contradictory evidence undermines the proposed rule;
- the user rejected the recommendation;
- the problem was already resolved;
- another active candidate already owns the same root cause;
- the candidate is too narrow to generalise.

Use the watchlist rather than a final no-op when the pattern is plausible but immature.

### Adequate Coverage but Continued Failure

Do not automatically choose no-op merely because documentation exists.

Investigate whether the real problem is:

- missing context loading;
- poor skill triggering;
- conflicting instructions;
- absent validation;
- stale examples;
- an implementation defect.

Route to the actual failure owner.

## Multiple Possible Destinations

When a pattern appears to require several changes, choose the canonical owner and describe secondary actions.

Example:

```text
Primary destination: existing skill
Secondary actions:
- Add one agent-instruction guardrail linking to the skill.
- Add a trigger regression eval.
- Remove a conflicting paragraph from the deployment runbook.
```

Avoid duplicating the complete instruction across all destinations.

## Confidence Adjustments

Lower confidence when:

- most evidence comes from one branch, task, operator, repository, or incident;
- observations were extracted only from sparse summaries;
- the proposed root cause is inferred;
- sessions agree on the symptom but not the remedy;
- contradictory evidence is substantial;
- current coverage could not be inspected.

Raise confidence when:

- the pattern appears across independent tasks and contexts;
- the user explicitly identified the same issue more than once;
- structured observations and raw turns agree;
- another retrospective identifies the same root cause;
- the same corrective workflow repeatedly succeeds;
- post-change sessions confirm the recommendation.

Never raise confidence above `HIGH`.

## Priority Adjustments

Raise priority when:

- failures are destructive or difficult to detect;
- the pattern blocks common work;
- users repeatedly intervene;
- the issue affects many agents or repositories;
- current instructions conflict;
- the same issue persists after attempted codification.

Lower priority when:

- the impact is primarily convenience;
- the workflow is uncommon;
- a reliable workaround already exists;
- the pattern is declining;
- the relevant system is being retired.

## Final Routing Check

Before emitting a recommendation, verify:

```text
[ ] The candidate represents one root cause.
[ ] Evidence comes from multiple sessions or qualifies for an exception.
[ ] Correlated sessions were not treated as independent.
[ ] Contradictory evidence was considered.
[ ] Existing coverage was inspected.
[ ] The proposed destination has clear ownership.
[ ] The recommended change is concrete.
[ ] Confidence and priority are independently justified.
[ ] A validation follow-up is defined.
[ ] The recommendation is not already promoted, rejected, or resolved.
```
