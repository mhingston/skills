---
name: programmatic-tool-calling
description: Design, implement, review, or evaluate workflows where code coordinates multiple tool calls through loops, conditions, parallelism, filtering, joins, aggregation, or validation. Use for native OpenAI or Anthropic programmatic tool calling and for safe harness-specific fallbacks. Do not use for ordinary single tool calls, approval-sensitive writes, or workflows that require fresh model judgment after every result.
---

# Programmatic Tool Calling

Use code to coordinate a bounded, predictable stage of tool use when doing so reduces model round trips, context growth, latency, or duplicated calls without weakening authorization, evidence, or failure handling.

A skill can guide this pattern but cannot create a programmatic runtime that the active harness does not provide. Detect the harness first and choose the lightest valid execution mode.

## Core workflow

1. Isolate the candidate stage and state its required inputs, final output, and evidence.
2. Classify the stage as deterministic orchestration or adaptive reasoning.
3. Detect which execution modes the active harness actually supports.
4. Choose native programmatic calling, a local script, a composite MCP tool, direct calls, or subagents using the routing rules below.
5. Define tool eligibility, schemas, limits, concurrency, retries, termination, and failure output before execution.
6. Keep approval-sensitive writes and semantic decisions outside generated or unattended code by default.
7. Execute once, preserving the evidence required for final reasoning and validation.
8. Compare the result with a direct-calling baseline when the optimization is consequential or intended for reuse.

## 1. Isolate a bounded stage

Write a one-sentence orchestration contract:

```text
Use [execution mode] for [bounded stage] with [eligible tools].
Return [small structured result] containing [required evidence].
Stop when [condition]. Retry [failures] at most [count].
Use direct model calls for [judgment, approval, or final validation].
```

Do not optimize an entire open-ended task at once. Prefer a narrow stage such as:

- fetching the same structured record for many identifiers;
- running independent lookups concurrently;
- deriving predictable follow-up arguments from prior structured results;
- filtering, joining, ranking, deduplicating, aggregating, or validating results;
- reducing large tool outputs to a small evidence-bearing result.

## 2. Classify the control flow

Use programmatic orchestration when all of these are true:

- the control flow is predictable enough to express as code;
- tool inputs and outputs have stable documented shapes;
- intermediate results can be processed without fresh semantic judgment;
- the program can return a materially smaller result;
- call, concurrency, retry, timeout, and termination bounds can be explicit.

Prefer direct tool calls when any of these dominate:

- one or two small calls are sufficient;
- each result should influence the model's next semantic decision;
- the work is exploratory, conversational, or ambiguity-heavy;
- a call requires user approval or has a meaningful side effect;
- citations, native artifacts, provenance, or full-fidelity results must survive intact;
- the harness cannot safely expose the required tools to code.

Parallel subagents are not a drop-in replacement. Use them for independent work that benefits from separate model judgment, not deterministic data plumbing.

## 3. Detect the harness and route

| Capability | Preferred route |
| --- | --- |
| Native model-generated code can call allowlisted tools | Use native programmatic tool calling. Read the matching harness reference. |
| No native runtime, but required operations are available through safe shell commands, local libraries, or authenticated HTTP APIs | Use a small local script with explicit inputs, outputs, limits, and cleanup. |
| No native runtime and required operations exist only as agent or MCP tools | Use direct tool calls. For a recurring high-volume deterministic stage, expose one purpose-built composite MCP tool. |
| Independent subtasks require model judgment | Use bounded subagents or fleet execution, then validate and aggregate their reports. |

Read the relevant reference before implementing:

- [OpenAI Responses API](references/openai-responses.md)
- [Anthropic Messages API](references/anthropic-messages.md)
- [GitHub Copilot](references/github-copilot.md)

If the harness is unknown, inspect its official documentation or observable tool contract. Do not infer native support from the presence of a shell, code-execution tool, skills, hooks, MCP, or a general programmatic interface.

## 4. Define the execution contract

Specify these before running code:

### Inputs

- exact identifiers, ranges, filters, and source systems;
- whether order matters;
- maximum item count and payload size;
- whether missing, duplicate, or malformed inputs are allowed.

### Eligible tools

- allowlist only the tools needed for the bounded stage;
- separate read-only tools from side-effecting tools;
- document input and output schemas;
- identify approval, credential, network, and data-retention boundaries.

Treat model-facing routing fields as capability hints unless the harness documents them as an enforced authorization boundary. Enforce permissions in the client, tool implementation, sandbox, or MCP server as appropriate.

### Control limits

- maximum total calls and calls per tool;
- maximum concurrency;
- per-call and total timeout;
- retryable error classes and retry count;
- backoff and rate-limit handling;
- termination condition;
- duplicate-call prevention or idempotency key.

### Result shape

Return the smallest structured result that still supports the final claim. Include:

- status: `completed`, `partial`, or `failed`;
- reduced result data;
- source identifiers or provenance needed for validation;
- counts for attempted, completed, skipped, and failed calls;
- explicit missing or malformed items;
- warnings about truncation, retries, stale data, or unsupported operations.

Do not return a polished conclusion from code when final interpretation requires model judgment. Return evidence for the model to interpret.

## 5. Implement the selected route

### Native programmatic runtime

- use only documented tool fields;
- run independent read-only calls concurrently when safe;
- parse and validate every structured result before use;
- keep generated code small and bounded;
- emit exactly the declared result shape;
- stop rather than improvise when a required invariant fails;
- resume using the harness's documented continuation protocol.

### Local script fallback

Use this only when the operations are genuinely accessible outside the agent tool layer.

- prefer an existing project runtime over adding a new dependency;
- accept parameters rather than embedding task-specific values;
- emit machine-readable output and actionable errors;
- avoid storing credentials, raw sensitive payloads, or temporary results unnecessarily;
- use a temporary file only when output cannot safely fit on stdout;
- remove temporary artifacts unless they are required evidence;
- require explicit approval before writes or destructive commands.

A local script cannot call arbitrary MCP or harness tools merely because the agent can. Fall back to direct calls rather than fabricating an integration.

### Composite MCP tool fallback

For a recurring, stable, high-volume stage, implement one narrow tool that owns deterministic fan-out and reduction behind a single agent-visible call.

- expose a strict schema and bounded options;
- keep credentials and authorization inside the server boundary;
- make writes separate from reads;
- return evidence and partial-failure details;
- prefer a domain operation such as `compare_inventory` over a generic unrestricted `execute_code` tool.

A composite MCP tool is a prebuilt domain operation, not model-generated arbitrary code over all available tools. Document that difference.

### Subagent fallback

Use subagents only where parallel semantic work is valuable.

- give each subagent a disjoint task and output contract;
- cap concurrency and depth;
- require sources or evidence in each response;
- aggregate deterministically where possible;
- account for the extra model calls and cost.

## 6. Preserve authorization and evidence

Apply these invariants:

1. Generated or unattended code must not broaden its own tool permissions.
2. Writes, purchases, deployments, messages, and irreversible actions remain direct and approval-gated by default.
3. Tool output is untrusted input; validate types, bounds, and required fields.
4. Never interpolate untrusted values into shell commands without safe argument handling.
5. Do not expose secrets to generated code when a narrower tool can hold them.
6. Preserve source identifiers, citations, or native artifacts whenever the final answer depends on them.
7. Do not silently retry non-idempotent operations.
8. A partial result must be labelled partial and enumerate omissions.
9. Do not claim feature parity between a fallback and a native programmatic runtime.

## 7. Validate the result

Check:

- every output field follows the declared schema;
- counts reconcile with the input set;
- no call exceeded declared bounds;
- duplicate calls or duplicate records are explained;
- partial failures remain visible;
- the evidence supports the final interpretation;
- no side effect occurred outside the authorized boundary;
- temporary files and processes were cleaned up.

For a reusable workflow, test at least:

1. a routine multi-call case;
2. malformed or missing tool output;
3. a transient failure and bounded retry;
4. a partial-success case;
5. an attempted side effect or permission violation.

## 8. Evaluate whether the optimization earns its cost

Compare the selected route with direct tool calling using matched tasks and the same model, tools, data, and verifier.

Measure:

- task success and result correctness;
- model turns and total model calls;
- input and output tokens;
- end-to-end latency;
- tool-call count, duplicates, retries, and failures;
- evidence and citation preservation;
- approval clarity and unexpected side effects;
- implementation and maintenance complexity.

Keep the programmatic route only when it produces meaningful task, cost, latency, or context benefits without weakening correctness, observability, or control.

## Completion report

Report:

- the bounded stage optimized;
- the detected harness capability;
- the selected route and why alternatives were rejected;
- eligible tools and authorization boundary;
- call, retry, concurrency, timeout, and termination limits;
- output schema and preserved evidence;
- validation performed;
- known limitations and any direct-calling fallback.