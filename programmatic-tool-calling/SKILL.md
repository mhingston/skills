---
name: programmatic-tool-calling
description: Design, implement, review, or evaluate workflows where code coordinates multiple tool calls through loops, conditions, parallelism, filtering, joins, aggregation, or validation. Use for native OpenAI or Anthropic programmatic tool calling and for safe harness-specific fallbacks. Do not use for ordinary single tool calls, approval-sensitive writes, or workflows that require fresh model judgment after every result.
---

# Programmatic Tool Calling

Use code to coordinate a bounded, predictable stage of tool use when doing so reduces model round trips, context growth, latency, duplicated work, or underlying operations without weakening authorization, evidence, or failure handling.

A skill can guide this pattern but cannot create a programmatic runtime that the active harness does not provide. Detect the harness first and choose the lightest valid execution mode.

## Optimize the right quantity

Do not use “tool calls” as one undifferentiated metric. Track these separately:

| Quantity | Meaning | Typical effect of programmatic orchestration |
| --- | --- | --- |
| Underlying operations | Actual API, MCP, database, shell, or other downstream invocations | Usually unchanged unless batching, caching, deduplication, projection, or early stopping removes work. |
| Agent-visible tool calls | Tool-call records exposed to the agent conversation | Often reduced by a batch or composite operation; native runtimes may still expose client-owned calls to the harness. |
| Model resumptions | Model sampling steps between tool results | Usually reduced substantially for predictable multi-call stages. |
| Model-context volume | Intermediate tool data entering the model context | Usually reduced when code performs deterministic filtering and aggregation. |

Moving 100 lookups into one script does not make them one downstream operation. Prefer eliminating unnecessary work before hiding orchestration overhead.

## Core workflow

1. Isolate the candidate stage and state its required inputs, final output, and evidence.
2. Name the optimization target: downstream operations, agent-visible calls, model resumptions, context volume, latency, or a combination.
3. Check for an existing native batch, aggregate, filtered, or projected operation before implementing client-side fan-out.
4. Classify the stage as deterministic orchestration or adaptive reasoning.
5. Detect which execution modes the active harness actually supports.
6. Choose native batching, native programmatic calling, a local script, a composite MCP tool, direct calls, or subagents using the routing rules below.
7. Define tool eligibility, schemas, limits, chunking, concurrency, retries, termination, and failure output before execution.
8. Execute once, preserving the evidence required for final reasoning and validation.
9. Compare the result with a direct-calling baseline when the optimization is consequential or intended for reuse.

## 1. Isolate a bounded stage

Write a one-sentence orchestration contract:

```text
Use [execution mode] for [bounded stage] with [eligible tools].
Optimize [named quantities] while preserving [required evidence].
Return [small structured result].
Stop when [condition]. Retry [failures] at most [count].
Use direct model calls for [judgment, approval, or final validation].
```

Do not optimize an entire open-ended task at once. Prefer a narrow stage such as:

- fetching the same structured record for many identifiers;
- running independent lookups concurrently;
- deriving predictable follow-up arguments from prior structured results;
- filtering, joining, ranking, deduplicating, aggregating, or validating results;
- paging until a declared evidence threshold or stop condition is met;
- reducing large tool outputs to a small evidence-bearing result.

## 2. Classify the control flow

Use programmatic orchestration when all of these are true:

- the control flow is predictable enough to express as code;
- tool inputs and outputs have stable documented shapes;
- intermediate results can be processed without fresh semantic judgment;
- the program can return a materially smaller result or avoid repeated model sampling;
- call, chunk, concurrency, retry, timeout, and termination bounds can be explicit.

Prefer direct tool calls when any of these dominate:

- one or two small calls are sufficient;
- each result should influence the model's next semantic decision;
- the work is exploratory, conversational, or ambiguity-heavy;
- a call requires user approval or has a meaningful side effect;
- citations, native artifacts, provenance, or full-fidelity results must survive intact;
- the harness cannot safely expose the required tools to code.

Parallel subagents are not a drop-in replacement. Use them for independent work that benefits from separate model judgment, not deterministic data plumbing.

### Fan-out guide

Use these as defaults, not rigid thresholds:

| Expected stage | Default route |
| --- | --- |
| 1–3 small calls | Direct calls unless the outputs are unusually large. |
| Several independent structured calls | Native batch operation first; otherwise native programmatic calling or a bounded local script. |
| Repeated high-volume deterministic work | Add or adopt a narrow batch or composite tool rather than rebuilding fan-out on every run. |
| Any number of calls requiring semantic judgment after each result | Direct calls or bounded subagents. |

Payload size, model-turn cost, rate limits, and reuse frequency matter more than item count alone.

## 3. Detect the harness and route

| Capability | Preferred route |
| --- | --- |
| An existing tool or API exposes the required batch, aggregate, filter, projection, or count operation | Use it directly. Avoid client-side fan-out that repeats work already supported server-side. |
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

### Operation minimization

Apply these in order where supported:

1. Use a native batch, aggregate, filtered, projected, count, or existence operation instead of fetching individual full records.
2. Normalize and deduplicate inputs before execution.
3. Reuse valid cached or already-completed results when freshness and provenance requirements allow it.
4. Request only fields needed for the declared result and evidence.
5. Page or process in bounded chunks rather than loading the entire candidate set.
6. Stop as soon as the declared completeness, confidence, threshold, or evidence condition is satisfied.
7. Do not prefetch speculative follow-ups that may never be needed.

Do not use caching or early stopping when the task contract requires fresh exhaustive results.

### Control limits

- maximum underlying operations and operations per tool;
- maximum agent-visible calls where the harness exposes them;
- chunk or page size and maximum pages;
- maximum concurrency;
- per-call and total timeout;
- retryable error classes and retry count;
- backoff and rate-limit handling;
- termination and early-stop conditions;
- duplicate-call prevention or idempotency key.

### Result shape

Return the smallest structured result that still supports the final claim. Include:

- status: `completed`, `partial`, or `failed`;
- reduced result data;
- source identifiers or provenance needed for validation;
- counts for inputs, underlying operations attempted, completed, skipped, deduplicated, cached, and failed;
- explicit missing or malformed items;
- warnings about truncation, early stopping, retries, stale data, or unsupported operations.

Keep deterministic evidence reduction separate from semantic interpretation:

- code may select fields, validate schemas, filter by declared predicates, sort by explicit keys, deduplicate, count, group, join, and calculate deterministic values;
- the model should decide meaning, relevance, causation, risk, significance, or any conclusion not fully specified by the execution contract.

Do not return a polished conclusion from code when final interpretation requires model judgment. Return evidence for the model to interpret.

## 5. Implement the selected route

### Native programmatic runtime

- use only documented tool fields;
- prefer an eligible native batch operation over loops of individual calls;
- run independent read-only calls concurrently when safe;
- use bounded chunks when fan-out could exceed payload, rate, or timeout limits;
- parse and validate every structured result before use;
- deduplicate completed work across retries or continuations;
- apply only declared deterministic reductions and early-stop conditions;
- keep generated code small and bounded;
- emit exactly the declared result shape;
- stop rather than improvise when a required invariant fails;
- resume using the harness's documented continuation protocol.

### Local script fallback

Use this only when the operations are genuinely accessible outside the agent tool layer.

- prefer an existing batch-capable project command or API endpoint before writing fan-out logic;
- prefer an existing project runtime over adding a new dependency;
- accept parameters rather than embedding task-specific values;
- emit machine-readable output and actionable errors;
- bound item count, chunk size, pages, concurrency, retries, and duration;
- avoid storing credentials, raw sensitive payloads, or temporary results unnecessarily;
- use a temporary file only when output cannot safely fit on stdout;
- remove temporary artifacts unless they are required evidence;
- require explicit approval before writes or destructive commands.

A local script cannot call arbitrary MCP or harness tools merely because the agent can. Fall back to direct calls rather than fabricating an integration.

### Composite MCP tool fallback

For a recurring, stable, high-volume stage, implement one narrow tool that owns deterministic fan-out and reduction behind a single agent-visible call.

- expose a strict schema and bounded options;
- use downstream bulk APIs where available;
- keep credentials and authorization inside the server boundary;
- make writes separate from reads;
- own deduplication, caching policy, chunking, rate limits, retries, and early stopping;
- return evidence, operation counts, and partial-failure details;
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
10. Do not describe reduced agent-visible calls as reduced downstream work unless the operation count actually fell.

## 7. Validate the result

Check:

- every output field follows the declared schema;
- counts reconcile with the input set and deduplication policy;
- no operation, page, concurrency, or retry bound was exceeded;
- duplicate calls or duplicate records are explained;
- early stopping satisfied the declared condition;
- partial failures remain visible;
- the evidence supports the final interpretation;
- no semantic judgment was silently embedded in deterministic reduction;
- no side effect occurred outside the authorized boundary;
- temporary files and processes were cleaned up.

For a reusable workflow, test at least:

1. a routine multi-call case;
2. malformed or missing tool output;
3. a transient failure and bounded retry;
4. a partial-success case;
5. an attempted side effect or permission violation;
6. duplicate inputs or replayed continuations;
7. a valid early-stop case and an exhaustive case where early stopping is forbidden.

## 8. Evaluate whether the optimization earns its cost

Compare the selected route with direct tool calling using matched tasks and the same model, tools, data, and verifier.

Measure separately:

- task success, result correctness, completeness, and evidence coverage;
- underlying operation count, including batch sub-operations where observable;
- agent-visible tool-call count;
- model turns and total model calls;
- input and output tokens and peak context volume;
- end-to-end latency and downstream service time;
- duplicates removed, cache hits, pages skipped, retries, and failures;
- evidence and citation preservation;
- approval clarity and unexpected side effects;
- implementation and maintenance complexity.

Keep the programmatic route only when it produces meaningful task, cost, latency, operation, or context benefits without weakening correctness, observability, or control.

## Completion report

Report:

- the bounded stage optimized;
- the named optimization target and baseline;
- the detected harness capability;
- the selected route and why alternatives were rejected;
- whether native batching or aggregation was available and used;
- eligible tools and authorization boundary;
- operation, chunk, page, retry, concurrency, timeout, and termination limits;
- output schema, deterministic reduction, and preserved evidence;
- validation performed;
- measured underlying operations, agent-visible calls, model turns, context/tokens, and latency where available;
- known limitations and any direct-calling fallback.
