# Comprehension Design

Use this reference to decide how much explanation a change requires and to help
an accountable human form a causal mental model without outsourcing their
judgment to the agent.

## Comprehension is distinct from correctness

An explanation can be clear and still be wrong. Passing a quiz can demonstrate
recognition and scenario reasoning, but it does not prove implementation
correctness or authorise approval.

The agent may teach, organise, visualise, and challenge. It must not write the
human's final explanation or risk acceptance for them.

## Comprehension-risk levels

### Low

Use a concise PR description when the change is local, familiar, reversible,
and easy to understand from the diff and focused tests.

Typical output:

- behaviour-first summary;
- affected surface;
- focused checks;
- material unknowns.

### Moderate

Add a causal walkthrough and human explain-back prompts when the change alters
an important invariant, crosses a meaningful boundary, or is difficult to infer
from local edits.

Typical output:

- before/after behaviour;
- representative input or scenario traced through the system;
- invariant and failure mode;
- extension points and trade-offs;
- unanswered questions.

### High

Create a full `explain-diff` artefact when one or more apply:

- multiple runtime, service, persistence, messaging, or trust boundaries;
- ordering, retries, concurrency, caching, migration, rollout, or compatibility
  materially determine behaviour;
- broad, irreversible, security-sensitive, or hard-to-observe failure impact;
- a large diff whose behaviour is not locally apparent;
- a long-running or multi-agent workflow caused the human to lose the thread;
- reviewers lack familiarity with the affected subsystem;
- a new abstraction or invariant will shape substantial future work.

## Causal explanation structure

Prefer this order:

1. decision frame and reader map;
2. previous behaviour;
3. new behaviour;
4. concrete toy example;
5. runtime or data-flow path;
6. invariant or governing rule;
7. implementation stages in causal order;
8. edge cases, evidence, and limitations;
9. participation guide for future work;
10. decision-support summary.

Use state transitions, timelines, sequence views, data-flow diagrams,
before/after comparisons, and interactive micro-worlds only when they reveal
cause and effect. Do not add interaction as decoration.

## Participation guide

Help the reader reason beyond the current diff by identifying:

- invariants future changes must preserve;
- natural extension points;
- intentionally unsupported cases;
- coupling and responsibility boundaries;
- consequential design trade-offs;
- likely changes for two or three plausible future requirements;
- useful questions for the author or domain owner;
- a small shared vocabulary.

## Understanding checks

Questions should test the causal model rather than names or syntax. Include
scenarios covering behaviour, runtime flow, invariants, failure modes, and a
future modification or trade-off.

Treat results as reflective evidence only. Do not use a score as an approval
condition without an explicit human-authored policy.

## Human explain-back

Leave these unanswered for the accountable human:

- Without referring to filenames, what behaviour changed?
- Trace one representative input through the affected system.
- What invariant must remain true?
- What is the most credible way that invariant could be violated?
- Which important behaviour is not established by the current tests?
- What signal would first indicate a production problem?
- How would the change be contained or reversed?
- What trade-off or residual risk would be accepted by proceeding?
- What would probably need to change for the next plausible requirement?

A response such as `reviewed`, `looks good`, or a pasted agent summary is not an
adequate explain-back for a consequential change.
