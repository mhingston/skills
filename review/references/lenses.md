# Review lenses

Use these briefs as independent ways to interrogate the same review packet.
Return an empty finding list when the evidence does not support an issue.

## Correctness

Construct concrete failures rather than listing generic risks.

Inspect:

- boundary values, empty and null inputs, Unicode, time and timezone edges;
- wrong conditions, ordering, coercion, rounding, overflow, and type semantics;
- swallowed errors, unsafe fallbacks, uncapped retries, and lost error context;
- concurrency, idempotency, check-then-act races, and locks across waits;
- resource, transaction, cursor, handle, and cleanup behaviour on failure;
- dependency or API behaviour the implementation assumes incorrectly.

State the input or event sequence that fails and the observable consequence.
Leave security impact to the security lens.

## Security

Trace hostile input across a trust boundary to a meaningful sink or exposure.

Inspect:

- injection, traversal, unsafe rendering, deserialisation, and dynamic loading;
- authentication, authorisation, tenancy, IDOR, CSRF, and session handling;
- secrets in source, URLs, errors, telemetry, or logs;
- validation at requests, queues, files, network, process, and persistence edges;
- SSRF, redirects, data exposure, cryptographic misuse, and exploitable
  dependency changes;
- abuse controls for sensitive or expensive operations.

For confirmed issues, describe attacker control, the path to the sink, required
preconditions, and impact. Cite a CWE when it is clear and useful. Put claims
requiring runtime or environmental confirmation in `Unverified`.

## Spec alignment

Compare behaviour with evidence of intent, not with an imagined ideal feature.

Inspect:

- omitted or partially implemented requirements;
- behaviour that contradicts quoted acceptance criteria;
- unrequested scope, dependencies, configuration, or public behaviour;
- compatibility commitments, non-goals, and preserved defaults;
- differences between documentation, user-visible text, and implementation;
- behaviour aimed at a different user or problem than the source of intent.

Quote the intent source and the conflicting implementation for a confirmed
finding. When `spec source: none`, limit confirmed findings to observable
behaviour changes and scope additions; do not invent requirements.

## Tests

Name the regression a missing or weak test would fail to catch.

Inspect:

- changed happy paths, error paths, trust boundaries, and public contracts;
- branches and domain-valid edge cases introduced by the change;
- assertions that do not establish behaviour or tests that cannot fail;
- mocks that replace the behaviour under test or assert implementation detail;
- nondeterminism from clocks, sleeps, real networks, shared state, or ordering;
- documented invariants and compatibility behaviour without regression tests.

Do not report raw coverage absence. Identify the test setup, stimulus, expected
observable result, and the meaningful regression it protects against.

## Design

Challenge maintenance cost while treating taste as non-blocking.

Inspect:

- speculative abstractions, options, layers, and extension points without a
  present caller or requirement;
- duplication of existing project, standard-library, or dependency behaviour;
- pass-through wrappers, middlemen, inappropriate intimacy, and leaky seams;
- misleading names, scattered responsibility, dead paths, and unused config;
- non-idiomatic machinery that increases the interface a maintainer must learn;
- opportunities to delete or deepen a module without changing behaviour.

For duplication, cite both implementations. For speculative generality, name
the absent second use. Prefer a minor or a trade-off when reasonable maintainers
could disagree.
