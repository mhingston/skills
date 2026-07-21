# Anthropic Messages API

Capability status: **native programmatic tool calling through code execution**

Last verified: 2026-07-21

Canonical source: <https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling>

## When to read this reference

Read this before designing, implementing, or reviewing programmatic tool calling with the Anthropic Messages API.

Verify current model, platform, code-execution version, and feature compatibility in the canonical documentation before implementation. Availability differs by model and hosting platform.

## Runtime model

Claude writes Python that invokes eligible tools as asynchronous functions inside the code-execution container.

When generated code invokes a client tool:

1. code execution pauses;
2. the API returns a `tool_use` block identifying the programmatic caller;
3. the client executes the tool and returns its result;
4. execution resumes in the same container;
5. only the final code output enters Claude's context.

Intermediate programmatic tool results remain outside Claude's context, enabling filtering and aggregation before the next model turn.

## Optimization semantics

Programmatic tool calling primarily reduces model round trips and context consumption. It does not make downstream work disappear:

- each programmatic tool call remains a separate invocation and is subject to the same rate limits as a regular tool call;
- concurrency can reduce elapsed time without reducing operation count;
- filtering and aggregation can reduce the data entering model context without reducing the source queries;
- loops reduce model resampling, not necessarily API, database, or MCP usage.

Reduce actual operations through native batch or aggregate endpoints, input deduplication, valid caching, projection, bounded pagination, and early termination.

Track underlying operations, agent-visible calls, model turns, and context volume separately.

## Prefer this mode when

- many structured records can be fetched and reduced in code;
- calls follow a predictable sequence or condition;
- independent calls can run concurrently with asynchronous Python;
- intermediate results would otherwise consume substantial context;
- code can produce a small evidence-bearing final output.

Prefer direct calls when each result requires semantic judgment, the task is exploratory, an action requires approval, or full native results and citations must remain visible to the model.

Prefer an existing tool or API batch operation over a loop of individual calls when both satisfy the same evidence and authorization contract.

## Tool declaration

Enable a compatible code-execution tool and declare client tools with an `allowed_callers` route that includes the supported code-execution caller.

Programmatically callable tools are exposed to generated Python as async functions. Each function receives one dictionary argument and returns the text supplied in the corresponding tool result. Generated code must parse and validate structured payloads explicitly.

Treat `allowed_callers` as routing guidance, not as an authorization boundary. Anthropic documents that a client should still be prepared to receive a direct invocation for any declared tool.

## Program boundary

Specify:

- the bounded stage and eligible tools;
- the optimization target: operations, model turns, context, latency, or a combination;
- whether a native batch or aggregate operation exists;
- the exact result shape and evidence fields;
- maximum operations, chunk size, pages, concurrency, retries, and execution duration;
- the stop and early-stop conditions;
- which decisions or actions must return to direct model control;
- how partial or malformed results are represented.

Keep the generated Python small. Prefer ordinary control flow, explicit parsing, bounded `asyncio.gather`, and deterministic reduction over open-ended agent logic inside the container.

## Operation minimization and stopping

Before generating fan-out code:

1. prefer a native batch, aggregate, count, existence, filter, or projection operation;
2. normalize and deduplicate identifiers;
3. reuse completed or cached results only when freshness and provenance allow it;
4. request only the fields needed for the declared result and evidence;
5. process large candidate sets in bounded chunks or pages;
6. terminate once the declared threshold, completeness condition, or evidence target is met;
7. avoid speculative calls whose results may not be needed.

Do not use early termination when the task requires fresh exhaustive coverage. Record why a stopping condition is sufficient.

## Evidence reduction boundary

Generated Python may perform deterministic reduction such as:

- schema validation and field selection;
- filtering by declared predicates;
- explicit sorting, grouping, joins, counts, and calculations;
- deduplication and reconciliation of identifiers;
- enforcement of declared stopping conditions.

Keep semantic relevance, causation, risk, significance, and unsupported ranking judgments for Claude unless the contract defines them completely and deterministically.

## Continuation protocol

Preserve the response's container identifier and caller metadata across continuation requests.

A program may pause multiple times as client tools are invoked. For each pause:

- execute only the named, authorized tool;
- validate its arguments and caller relationship;
- return the result using the matching tool-use identifier;
- preserve the container identifier exactly;
- resume before the documented expiry or pending-call timeout.

Do not restart the workflow from scratch merely because one tool call paused code execution. Do not reuse a container beyond the documented lifetime.

Track completed operations across pauses and retries so successful calls are not repeated unnecessarily.

## Permissions and security

- enforce authorization in the client and tool implementation;
- do not rely on `allowed_callers` as a hard security control;
- keep writes and irreversible actions direct and approval-gated by default;
- validate tenant, resource, and scope on every tool invocation;
- avoid returning secrets or unnecessary sensitive payloads to the container;
- treat tool results as untrusted input;
- use bounded concurrency to protect downstream systems.

## Feature constraints

Programmatic calling may be incompatible with or constrained by other API features. The documented constraints currently include combinations involving strict structured tool outputs, forced tool choice, and disabled parallel tool use.

Recheck the canonical documentation before combining advanced features. Fail closed when the requested combination is unsupported rather than silently reverting to a weaker contract.

The feature uses code-execution infrastructure and has its own data-retention and platform-availability constraints. Verify these against the current task's privacy and compliance requirements.

## Failure handling

Return a structured partial or failed result when:

- the container or pending call expires;
- a tool result is malformed or cannot be parsed;
- the retry or concurrency budget is exhausted;
- a direct call appears where policy requires programmatic routing;
- an approval-sensitive action is requested from code;
- required provenance cannot be preserved.

Do not retry non-idempotent operations automatically. Make completed, omitted, failed, skipped, deduplicated, and cached items explicit in the final code output.

## Observability

Record at least:

- container and tool-use identifiers;
- direct versus programmatic caller type;
- tools invoked and argument validation outcome;
- underlying operation count and operation count per tool;
- agent-visible call count where observable;
- model resumptions, billed input tokens, and context reduction;
- chunk size, pages, concurrency, retries, and duration;
- completed, partial, failed, skipped, deduplicated, and cached item counts;
- container expiry or timeout events;
- result parsing and schema failures;
- the reduction performed before results entered model context;
- the stop reason and whether execution was exhaustive or terminated early.

## Review checklist

- [ ] The selected model and hosting platform currently support the required code-execution version.
- [ ] The stage is predictable and bounded.
- [ ] The optimization target is named and measured separately from downstream operation count.
- [ ] A native batch or aggregate operation was preferred where available.
- [ ] Tool outputs are structured and validated before use.
- [ ] `allowed_callers` is not treated as the security boundary.
- [ ] Container and caller metadata are preserved correctly.
- [ ] Calls, chunks, pages, concurrency, retries, timeout, and termination are bounded.
- [ ] Early termination is declared and justified, or exhaustive execution is required.
- [ ] Deterministic reduction is separated from semantic interpretation.
- [ ] Writes and approval-sensitive actions remain direct by default.
- [ ] Completed operations are not duplicated across pauses or recovery.
- [ ] Partial failures remain visible in the final output.
- [ ] Required evidence survives context reduction.
- [ ] Current platform, retention, and feature-combination constraints were checked.
- [ ] The workflow has been compared with a direct-calling baseline using operations, model turns, tokens, latency, correctness, and evidence coverage.
