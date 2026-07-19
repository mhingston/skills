# OpenAI Responses API

Capability status: **native programmatic tool calling**

Last verified: 2026-07-19

Canonical source: <https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling>

## When to read this reference

Read this before designing, implementing, or reviewing Programmatic Tool Calling with the OpenAI Responses API.

Verify the current model compatibility and API contract in the canonical documentation before implementation. Do not assume a model supports the feature because it supports ordinary tool calling or code execution.

## Runtime model

OpenAI lets the model compose JavaScript that coordinates eligible tools in a hosted runtime.

The runtime is a fresh isolated V8 environment with top-level `await`. It does not provide Node.js, package installation, direct network access, a general-purpose filesystem, subprocess execution, a console, or persistent JavaScript state between program executions.

The generated JavaScript interacts with external systems only through tools enabled in the Responses API request. The client continues to execute client-owned tool calls returned by the API; the client does not execute the generated JavaScript itself.

## Prefer this mode when

- several structured results can be filtered, joined, ranked, deduplicated, aggregated, or validated;
- dependent calls have predictable data flow;
- a bounded stage can return a much smaller structured result;
- loops, conditions, or parallel calls can avoid model resampling between operations.

Prefer direct calls for a single lookup, adaptive semantic search, approval-sensitive writes, or final citation and native-artifact validation unless the program preserves all required provenance.

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
- whether independent calls may run concurrently;
- the result shape and evidence fields;
- maximum calls, retries, concurrency, and timeouts;
- the stop condition;
- the direct-calling handoff for semantic judgment, approval, or final validation.

Avoid switching between direct and programmatic routes for the same stage or repeating completed work.

## Continuation protocol

A response may contain:

- a `program` item with generated JavaScript, a call ID, and replay or continuation metadata;
- tool-call items made by that program;
- a `program_output` item with a completed or incomplete status;
- a final assistant message in the same or a later response.

Return client-owned tool results using the documented call identifiers and continue until the final message or an explicit terminal failure. Preserve all required opaque continuation metadata exactly as returned.

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

Do not retry non-idempotent calls automatically.

## Observability

Record at least:

- program and tool call identifiers;
- eligible and invoked tools;
- call count, concurrency, retries, and duration;
- completed, partial, and failed item counts;
- program output status;
- approval pauses and denials;
- schema validation failures;
- evidence omitted or reduced before the final model turn.

## Review checklist

- [ ] The selected model currently supports Programmatic Tool Calling.
- [ ] The stage is predictable and bounded.
- [ ] Tool schemas are strict enough for generated JavaScript.
- [ ] Tool eligibility is narrower than the full agent toolset.
- [ ] Writes and approval-sensitive actions remain direct by default.
- [ ] Limits, retries, timeout, and termination are explicit.
- [ ] The result is smaller while preserving required evidence.
- [ ] Continuation metadata and call IDs are handled exactly.
- [ ] Partial failure remains visible.
- [ ] The workflow has been compared with a direct-calling baseline.