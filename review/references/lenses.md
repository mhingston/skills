# Review dimensions

Use these briefs as independent ways to interrogate the same immutable review packet. Return an empty finding list when the evidence does not support an issue.

Every dimension must state:

- why it applies to this change;
- which topology, boundary, or invariant it inspected;
- what evidence it could and could not establish;
- any candidate findings using the report contract.

## Baseline dimensions

### Correctness

Construct concrete failures rather than listing generic risks.

Inspect:

- boundary values, empty and null inputs, Unicode, time and timezone edges;
- wrong conditions, ordering, coercion, rounding, overflow, and type semantics;
- swallowed errors, unsafe fallbacks, uncapped retries, and lost error context;
- concurrency, idempotency, check-then-act races, and locks across waits;
- resource, transaction, cursor, handle, and cleanup behaviour on failure;
- dependency or API behaviour the implementation assumes incorrectly.

State the input or event sequence that fails and the observable consequence. Leave security impact to the security dimension unless the same root cause creates a compound risk.

### Security

Trace hostile input or capability across a trust boundary to a meaningful sink or exposure.

Inspect:

- injection, traversal, unsafe rendering, deserialisation, and dynamic loading;
- authentication, authorisation, tenancy, IDOR, CSRF, and session handling;
- secrets in source, URLs, errors, telemetry, or logs;
- validation at requests, queues, files, network, process, and persistence edges;
- SSRF, redirects, data exposure, cryptographic misuse, and exploitable dependency changes;
- abuse controls for sensitive or expensive operations.

For confirmed issues, describe attacker control, the path to the sink, required preconditions, and impact. Cite a CWE when it is clear and useful. Put claims requiring runtime or environmental confirmation in `Unverified`.

### Specification alignment

Compare behaviour with evidence of intent, not with an imagined ideal feature.

Inspect:

- omitted or partially implemented requirements;
- behaviour that contradicts quoted acceptance criteria;
- unrequested scope, dependencies, configuration, or public behaviour;
- compatibility commitments, non-goals, and preserved defaults;
- differences between documentation, user-visible text, and implementation;
- behaviour aimed at a different user or problem than the source of intent.

Quote the intent source and the conflicting implementation for a confirmed finding. When `spec source: none`, limit confirmed findings to observable behaviour changes and scope additions; do not invent requirements.

### Test adequacy

Name the regression a missing or weak test would fail to catch.

Inspect:

- changed happy paths, error paths, trust boundaries, and public contracts;
- branches and domain-valid edge cases introduced by the change;
- assertions that do not establish behaviour or tests that cannot fail;
- mocks that replace the behaviour under test or assert implementation detail;
- nondeterminism from clocks, sleeps, real networks, shared state, or ordering;
- documented invariants and compatibility behaviour without regression tests.

Do not report raw coverage absence. Identify the test setup, stimulus, expected observable result, and the meaningful regression it protects against.

### Design and maintainability

Challenge maintenance cost while treating taste as non-blocking.

Inspect:

- speculative abstractions, options, layers, and extension points without a present caller or requirement;
- duplication of existing project, standard-library, or dependency behaviour;
- pass-through wrappers, middlemen, inappropriate intimacy, and leaky seams;
- misleading names, scattered responsibility, dead paths, and unused configuration;
- non-idiomatic machinery that increases the interface a maintainer must learn;
- opportunities to delete or deepen a module without changing behaviour.

For duplication, cite both implementations. For speculative generality, name the absent second use. Prefer a minor, trade-off, or `redirect-to-design` disposition when reasonable maintainers could disagree.

## Change-specific dimension template

Add a dynamic dimension only when the change anatomy supplies evidence that the baseline dimensions would not give the boundary enough focused attention.

Use this shape:

```text
Dimension:
Reason selected:
Topology evidence:
Primary question:
Credible failure or exposure:
Evidence required to confirm:
Evidence required to dismiss:
Likely specialist authority:
```

Do not use a generic dynamic dimension such as `architecture` or `quality`. Name the actual boundary or failure mechanism.

## Common change-specific dimensions

### Data integrity and migration safety

Select when the change alters persistence, schemas, migrations, transactions, reconciliation, retention, deletion, or data ownership.

Inspect:

- forward and backward compatibility during mixed-version operation;
- partial migration, restart, replay, duplicate execution, and rollback behaviour;
- constraints, defaults, nullability, backfills, and irreversible transforms;
- lost updates, silent truncation, corruption, orphaning, or inconsistent replicas;
- recovery evidence and the authority permitted to accept irreversible data risk.

### Concurrency, ordering, retries, and idempotency

Select when behaviour depends on parallel execution, asynchronous messages, queues, retries, leases, distributed locks, or timing.

Inspect:

- duplicate delivery and replay;
- out-of-order events and stale reads;
- check-then-act races and lock scope;
- retry storms, poison messages, and non-idempotent side effects;
- cancellation, timeout, partial completion, and ownership transfer.

Describe a specific interleaving or event sequence rather than saying a race is possible.

### API, event, schema, and dependency compatibility

Select when the change alters a public or cross-component contract.

Inspect:

- existing consumers and version skew;
- optional versus required fields and tolerant-reader assumptions;
- default behaviour, error contracts, status codes, and serialization;
- generated clients, fixtures, documentation, and compatibility tests;
- transitive dependency behaviour, minimum versions, and downgrade paths.

### Privacy, tenancy, authentication, and authorisation

Select when personal, tenant-scoped, privileged, regulated, or identity-linked data crosses a new path.

Inspect:

- subject and tenant identity propagation;
- purpose limitation, minimisation, retention, deletion, and auditability;
- authorisation at every independently reachable boundary;
- logs, traces, caches, exports, and error messages;
- specialist or policy approval requirements.

### Resilience, performance, capacity, and cost

Select when the change adds remote calls, loops, fan-out, large data movement, expensive inference, caching, resource contention, or new failure dependencies.

Inspect:

- timeout, retry, circuit-breaking, and fallback behaviour;
- amplification, unbounded cardinality, queue growth, and memory pressure;
- latency on critical paths and tail behaviour;
- cache correctness and stampedes;
- cost ceilings, abuse paths, and degraded-mode behaviour.

### Deployment, rollout, rollback, and observability

Select when safe operation depends on release sequencing, feature flags, migration order, configuration, or production detection.

Inspect:

- staged rollout and isolation controls;
- compatibility during deployment and rollback;
- whether rollback is genuinely possible after side effects;
- metrics, logs, traces, alerts, and ownership needed to detect failure;
- containment procedure and expected blast radius.

### Domain-specific invariant

Select when the intent source or repository establishes a domain rule not captured by a generic dimension.

State the invariant verbatim or with a precise citation. Trace how the change preserves or violates it, which evidence would detect a breach, and who may accept residual risk.

## Compound-risk synthesis

After candidate findings are validated, identify interactions where:

- two individually bounded findings share a runtime path or trust boundary;
- a missing control makes another defect reachable;
- a compatibility issue combines with rollout order or weak detection;
- repeated local complexity creates a system-level reliability or operability risk.

Do not create a compound risk merely because findings touch the same file. Cite the causal interaction and preserve links to the underlying findings.