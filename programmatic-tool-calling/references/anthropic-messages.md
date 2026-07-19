# Anthropic Messages API

Capability status: **native programmatic tool calling through code execution**

Last verified: 2026-07-19

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

## Prefer this mode when

- many structured records can be fetched and reduced in code;
- calls follow a predictable sequence or condition;
- independent calls can run concurrently with asynchronous Python;
- intermediate results would otherwise consume substantial context;
- code can produce a small evidence-bearing final output.

Prefer direct calls when each result requires semantic judgment, the task is exploratory, an action requires approval, or full native results and citations must remain visible to the model.

## Tool declaration

Enable a compatible code-execution tool and declare client tools with an `allowed_callers` route that includes the supported code-execution caller.

Programmatically callable tools are exposed to generated Python as async functions. Each function receives one dictionary argument and returns the text supplied in the corresponding tool result. Generated code must parse and validate structured payloads explicitly.

Treat `allowed_callers` as routing guidance, not as an authorization boundary. Anthropic documents that a client should still be prepared to receive a direct invocation for any declared tool.

## Program boundary

Specify:

- the bounded stage and eligible tools;
- the exact result shape and evidence fields;
- maximum calls, concurrency, retries, and execution duration;
- the stop condition;
- which decisions or actions must return to direct model control;
- how partial or malformed results are represented.

Keep the generated Python small. Prefer ordinary control flow, explicit parsing, bounded `asyncio.gather`, and deterministic reduction over open-ended agent logic inside the container.

## Continuation protocol

Preserve the response's container identifier and caller metadata across continuation requests.

A program may pause multiple times as client tools are invoked. For each pause:

- execute only the named, authorized tool;
- validate its arguments and caller relationship;
- return the result using the matching tool-use identifier;
- preserve the container identifier exactly;
- resume before the documented expiry or pending-call timeout.

Do not restart the workflow from scratch merely because one tool call paused code execution. Do not reuse a container beyond the documented lifetime.

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

## Failure handling

Return a structured partial or failed result when:

- the container or pending call expires;
- a tool result is malformed or cannot be parsed;
- the retry or concurrency budget is exhausted;
- a direct call appears where policy requires programmatic routing;
- an approval-sensitive action is requested from code;
- required provenance cannot be preserved.

Do not retry non-idempotent operations automatically. Make omitted and failed items explicit in the final code output.

## Observability

Record at least:

- container and tool-use identifiers;
- direct versus programmatic caller type;
- tools invoked and argument validation outcome;
- call count, concurrency, retries, and duration;
- completed, partial, and failed item counts;
- container expiry or timeout events;
- result parsing and schema failures;
- the reduction performed before results entered model context.

## Review checklist

- [ ] The selected model and hosting platform currently support the required code-execution version.
- [ ] The stage is predictable and bounded.
- [ ] Tool outputs are structured and validated before use.
- [ ] `allowed_callers` is not treated as the security boundary.
- [ ] Container and caller metadata are preserved correctly.
- [ ] Writes and approval-sensitive actions remain direct by default.
- [ ] Calls, concurrency, retries, timeout, and termination are bounded.
- [ ] Partial failures remain visible in the final output.
- [ ] Required evidence survives context reduction.
- [ ] The workflow has been compared with a direct-calling baseline.
