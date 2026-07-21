# OpenAI Responses API

Capability status: **native programmatic tool calling**

Last verified: 2026-07-21

Canonical source: <https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling>

## When to read this reference

Read this before designing, implementing, or reviewing Programmatic Tool Calling with the OpenAI Responses API.

Verify the current model compatibility and API contract in the canonical documentation before implementation. Do not assume a model supports the feature because it supports ordinary tool calling or code execution.

## Runtime model

OpenAI lets the model compose JavaScript that coordinates eligible tools in a hosted runtime.

The runtime is a fresh isolated V8 environment with top-level `await`. It does not provide Node.js, package installation, direct network access, a general-purpose filesystem, subprocess execution, a console, or persistent JavaScript state between program executions.

The generated JavaScript interacts with external systems only through tools enabled in the Responses API request. The client continues to execute client-owned tool calls returned by the API; the client does not execute the generated JavaScript itself.

## Optimization semantics

Programmatic Tool Calling primarily reduces model-mediated orchestration overhead:

- fewer model resumptions between predictable tool calls;
- less intermediate tool output entering model context;
- lower latency where independent calls can run concurrently;
- deterministic filtering and aggregation before final reasoning.

It does not automatically turn many downstream calls into one downstream operation. Reduce actual operations through native batch or aggregate endpoints, input deduplication, valid caching, field projection, bounded pagination, and early stopping.

Track underlying operations, agent-visible calls, model turns, and context volume separately.

## Prefer this mode when

- several structured results can be filtered, joined, ranked, deduplicated, aggregated, or validated;
- dependent calls have predictable data flow;
- a bounded stage can return a much smaller structured result;
- loops, conditions, or parallel calls can avoid model resampling between operations.

Prefer direct calls for a single lookup, adaptive semantic search, approval-sensitive writes, or final citation and native-artifact validation unless the program preserves all required provenance.

Prefer an existing tool or API batch operation over a loop of individual calls when both satisfy the same evidence and authorization contract.

## Tool declaration

Add the hosted `programmatic_tool_calling` tool to the request and configure eligible tools with `allowed_callers`.

Typical values are:

- omitted or `["direct"]`: direct model invocation;
- `["programmatic"]`: invocation from generated program code;
- `["direct", "programmatic"]`: either route.

For predictable structured tool results, define both the input `parameters` schema and `output_schema`. Generated code should use only documented fields and validate results before processing them.

Supported eligible tool categories currently include functions, custom tools, MCP tools, apply-patch, local or hosted shell, and code interpreter. Recheck the official documentation because this set may change.

## Program boundary

Define one bounded stage rather than granting a generic instruction to use programmatic calling efficiently.

Specify:

- the exact tools the program may call;
- the optimization target: operations, model turns, context, latency, or a combination;
- whether a native batch or aggregate operation exists;
- whether independent calls may run concurrently;
- the result shape and evidence fields;
- maximum operations, chunk size, pages, retries, concurrency, and timeouts;
- the stop and early-stop conditions;
- the direct-calling handoff for semantic judgment, approval, or final validation.

Avoid switching between direct and programmatic routes for the same stage or repeating completed work.

## Operation minimization and stopping

Before generating fan-out code:

1. prefer a native batch, aggregate, count, existence, filter, or projection operation;
2. normalize and deduplicate identifiers;
3. reuse completed or cached results only when freshness and provenance allow it;
4. request only the fields needed for the declared result and evidence;
5. process large candidate sets in bounded chunks or pages;
6. stop once the declared threshold, completeness condition, or evidence target is met;
7. avoid speculative calls whose results may not be needed.

Do not use early stopping when the task requires fresh exhaustive coverage. Record why the stop condition is sufficient.

## Evidence reduction boundary

Generated JavaScript may perform deterministic reduction such as:

- schema validation and field selection;
- filtering by declared predicates;
- explicit sorting, grouping, joins, counts, and calculations;
- deduplication and reconciliation of identifiers;
- enforcement of declared stopping conditions.

Keep semantic relevance, causation, risk, significance, and unsupported ranking judgments for the model unless the contract defines them completely and deterministically.

## Continuation protocol

A response may contain:

- a `program` item with generated JavaScript, a call ID, and replay or continuation metadata;
- tool-call items made by that program;
- a `program_output` item with a completed or incomplete status;
- a final assistant message in the same or a later response.

Return client-owned tool results using the documented call identifiers and continue until the final message or an explicit terminal failure. Preserve all required opaque continuation metadata exactly as returned.

Deduplicate completed operations across continuation or replay. Do not rerun successful calls merely because a later call failed.

## Permissions and approvals

Treat tool eligibility as only one layer of control.

- enforce authorization in the client and tool implementation;
- keep writes and irreversible actions direct and approval-gated by default;
- do not expose credentials when a narrow tool can hold them;
- validate every programmatic call against the expected tool, schema, tenant, and scope;
- preserve MCP approval policies where applicable.

## Failure handling

The program must not silently improvise around malformed or missing tool output.

Return a structured partial or failed result when:

- a required field is missing or invalid;
- a rate limit or timeout exceeds the retry budget;
- an approval is denied or unavailable;
- a tool attempts an unsupported route;
- the required evidence cannot be preserved.

Do not retry non-idempotent calls automatically. Keep successful, failed, skipped, deduplicated, and cached items distinguishable.

## Observability

Record at least:

- program and tool call identifiers;
- eligible and invoked tools;
- underlying operation count and operation count per tool;
- agent-visible call count where observable;
- model resumptions, input and output tokens, and context reduction;
- chunk size, pages, concurrency, retries, and duration;
- completed, partial, failed, skipped, deduplicated, and cached item counts;
- program output status and stop reason;
- approval pauses and denials;
- schema validation failures;
- evidence omitted or reduced before the final model turn.

## Review checklist

- [ ] The selected model currently supports Programmatic Tool Calling.
- [ ] The stage is predictable and bounded.
- [ ] The optimization target is named and measured separately from downstream operation count.
- [ ] A native batch or aggregate operation was preferred where available.
- [ ] Tool schemas are strict enough for generated JavaScript.
- [ ] Tool eligibility is narrower than the full agent toolset.
- [ ] Chunk, page, concurrency, retry, timeout, and termination bounds are explicit.
- [ ] Early stopping is declared and justified, or exhaustive execution is required.
- [ ] Deterministic reduction is separated from semantic interpretation.
- [ ] Writes and approval-sensitive actions remain direct by default.
- [ ] The result is smaller while preserving required evidence.
- [ ] Continuation metadata and call IDs are handled exactly.
- [ ] Completed operations are not duplicated across replay or recovery.
- [ ] Partial failure remains visible.
- [ ] The workflow has been compared with a direct-calling baseline using operations, model turns, tokens, latency, correctness, and evidence coverage.
