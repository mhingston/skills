# Curriculum Architect Protocol

Use a curriculum architect to turn a broad capability goal into a small, testable prerequisite graph. It creates structure; it never teaches, grades, or claims mastery.

## When to isolate it

Prefer a fresh-context architect when any of these apply:

- the arc is broader than roughly 12 plausible concepts;
- multiple sources must be reconciled;
- prerequisite mistakes would make later assessment misleading;
- the topic is consequential, specialized, or unfamiliar to the tutor;
- the primary conversation already contains enough teaching context to bias decomposition.

For a small and familiar arc, the tutor may build the graph directly while following the same contract.

## Inputs

Give the architect only decision-relevant context:

```json
{
  "topic": "distributed tracing",
  "capability_goal": "Diagnose latency across three services using traces",
  "deadline": "optional",
  "prior_exposure": "shaky on propagation; comfortable with HTTP",
  "mission": {
    "why": "Support production incidents",
    "success": ["Locate the critical path", "Distinguish queueing from service time"],
    "constraints": ["Use OpenTelemetry terminology"],
    "out_of_scope": ["Vendor-specific dashboard training"]
  },
  "sources": [],
  "source_gaps": []
}
```

Do not include tutor opinions about what the learner "seemed to understand." Demonstrated knowledge belongs in receipts; claimed prior knowledge must remain labelled as a claim.

## Required output

Return one JSON topic payload accepted by `add-topic`:

```json
{
  "topic": "distributed-tracing",
  "title": "Distributed tracing",
  "goal": "Diagnose latency across three services using traces",
  "mission": null,
  "sources": [],
  "source_gaps": [],
  "order": ["trace-context", "span-parentage", "critical-path"],
  "nodes": {
    "trace-context": {
      "claim": "Trace context links work across process boundaries.",
      "probe": "What must cross a service boundary for two spans to remain in one trace?",
      "rubric": [
        "identifies propagated trace context",
        "distinguishes propagation from log correlation by timestamp"
      ],
      "requires": [],
      "transfer_probe": "A message is placed on a queue and handled later. What must be preserved?",
      "arbitrary": false,
      "threshold": true
    }
  }
}
```

## Graph rules

- Work backwards from observable success, not forwards from a textbook table of contents.
- Each node contains one declarative, testable claim.
- A probe must require production and must not leak the claim.
- Rubrics contain two to four observable criteria, not impressions such as "shows understanding."
- `requires` contains only hard prerequisites. Avoid decorative edges.
- Every prerequisite appears earlier in `order`; cycles are forbidden.
- Use a transfer probe only when changed-context application is meaningful.
- Mark irregular facts `arbitrary: true`; do not invent a causal derivation for them.
- Mark `threshold: true` only when crossing the concept changes how many later ideas become intelligible.
- Prefer 4–12 nodes in one learning arc. Split a larger map into sequenced arcs.

## Source handling

For source-sensitive learning:

- record the small set of sources that control terminology, policy, or mechanism;
- state what each source is used for;
- preserve unresolved source gaps explicitly;
- do not silently fill a source gap with model memory;
- do not turn source coverage into evidence that the learner understands it.

## Validation pass

Before returning the graph, check:

1. Can each claim be graded from the rubric without seeing a lesson transcript?
2. Does every prerequisite represent something that must genuinely be known first?
3. Would a learner who passes all required nodes be able to perform the stated capability?
4. Are any nodes merely chapter headings, activities, or compound bundles?
5. Are threshold and arbitrary flags defensible?
6. Are source gaps visible?

## Separation of powers

The architect may create or revise concept structure. It must not:

- assess learner productions;
- infer mastery from prior conversation;
- choose receipt grades;
- modify scheduler state;
- erase receipts when revising a graph.

When replacing a graph, preserve existing node identities where the underlying claim is unchanged. Never orphan canonical receipts merely to make the map cleaner.
