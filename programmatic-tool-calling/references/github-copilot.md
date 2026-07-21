# GitHub Copilot

Capability status: **no documented native hosted programmatic-tool-calling runtime equivalent; use Copilot-native capability fallbacks**

Last verified: 2026-07-21

Canonical sources:

- Copilot CLI overview: <https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview>
- Copilot CLI programmatic reference: <https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference>
- Copilot CLI command reference: <https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference>
- Agent skills: <https://docs.github.com/en/copilot/concepts/agents/about-agent-skills>
- Adding CLI skills: <https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills>
- Copilot plugins: <https://docs.github.com/en/copilot/concepts/agents/about-plugins>
- Hooks: <https://docs.github.com/en/copilot/reference/hooks-reference>
- Fleet and subagents: <https://docs.github.com/en/copilot/concepts/agents/copilot-cli/fleet>

## When to read this reference

Read this when applying the skill in GitHub Copilot CLI, Copilot cloud agent, Copilot code review, the GitHub Copilot app, or IDE agent mode.

The skill must remain directly usable as an Agent Skill. Do not require a separate embedding SDK or application runtime.

## Capability finding

The official Copilot documentation reviewed on 2026-07-21 describes:

- ordinary agent tool use;
- shell, file, URL, and MCP tools;
- Agent Skills containing instructions, scripts, and resources;
- custom agents and parallel subagents;
- lifecycle hooks and installable plugins;
- non-interactive CLI prompting and programmatic CLI invocation.

It does not document an OpenAI- or Anthropic-style hosted runtime where model-generated code can invoke arbitrary allowlisted agent or MCP tools repeatedly inside one model turn while keeping intermediate results outside model context.

Do not claim native feature parity unless newer official documentation establishes it.

## Optimization semantics

In Copilot, a local script can reduce model round trips for shell-, library-, CLI-, or API-accessible work, but it does not automatically reduce downstream operations.

Track these separately:

- underlying CLI, API, database, or MCP operations;
- agent-visible tool calls;
- model or agent invocations;
- model-context volume and transcript size;
- elapsed time and downstream service time.

A single shell call that runs a script may hide 100 API requests from the conversation while still performing all 100 requests. Reduce actual work with native bulk commands, server-side filtering and projection, deduplication, valid caching, bounded pagination, and early stopping.

## Route selection

Use this decision order.

### 1. Existing batch, aggregate, or filtered operation

Before writing a script, check whether the existing CLI, library, HTTP API, or MCP tool already supports:

- multiple identifiers in one request;
- bulk retrieval or mutation;
- server-side filtering or field projection;
- counts, existence checks, summaries, or aggregation;
- pagination controls or continuation tokens.

Prefer the narrowest existing operation that returns the required evidence. A server-side batch or aggregate operation is normally better than client-side fan-out because it can reduce downstream work rather than only agent-visible calls.

Do not emulate batching by recursively invoking Copilot once per item.

### 2. Skill-bundled or task-local script for shell-accessible operations

Use a small script when every required operation is available through:

- existing project commands;
- safe local libraries already present in the repository;
- authenticated command-line tools;
- documented HTTP APIs that the environment is allowed to access.

This is the closest Copilot-native fallback for deterministic fan-out, filtering, aggregation, and validation. Agent Skills explicitly support supplementary scripts and resources, so the technique can remain packaged with the skill when the script is reusable.

The script must:

- have explicit parameters and structured output;
- normalize and deduplicate inputs;
- prefer native bulk operations over loops of individual calls;
- cap item count, chunk size, pages, concurrency, retries, and duration;
- define an early-stop condition where exhaustive coverage is not required;
- request only fields needed for the declared output and evidence;
- use safe argument handling rather than shell interpolation;
- keep credentials outside generated source;
- avoid writes unless separately approved;
- preserve source identifiers, operation counts, and partial failures;
- be removed after use unless it is intentionally retained as a reusable skill or project script.

This route uses Copilot's normal shell execution. It is not native programmatic tool calling, but it can perform many deterministic multi-call workloads without extra model turns between each operation.

### 3. Direct calls for MCP-only or harness-only tools

A local process cannot call an arbitrary Copilot or MCP tool merely because the agent can see it.

When the required operation exists only in the agent tool layer:

- use direct calls with an explicit underlying-operation and agent-visible-call budget;
- batch requests only if the tool natively supports batching;
- reduce results between calls where the harness permits;
- stop paging once the declared evidence condition is met;
- preserve approval boundaries, source identifiers, and citations;
- stop rather than fabricating an unavailable code-to-tool bridge.

For a one-off or low-volume workflow, this is usually the correct route.

### 4. Purpose-built composite MCP tool for recurring workflows

For a stable, repeated, high-volume deterministic stage, create or adopt a narrow MCP tool that performs bounded fan-out and reduction behind one agent-visible call.

Examples:

- `fetch_issue_summaries(issue_numbers, fields, concurrency)`;
- `compare_inventory(skus)`;
- `validate_repositories(repositories, checks)`.

Prefer a domain-specific composite tool over a generic `execute_code` or `invoke_any_tool` interface.

The MCP server should own:

- credentials and authorization;
- downstream bulk-operation selection;
- input normalization and duplicate suppression;
- caching and freshness policy where allowed;
- chunking, pagination, concurrency, retries, rate limiting, and timeouts;
- strict input and output schemas;
- idempotency and replay protection;
- early stopping and exhaustive-mode semantics;
- provenance, operation counts, and partial-failure reporting.

Copilot CLI can configure MCP servers directly. When distribution justifies it, a Copilot plugin can package the standalone skill with MCP configuration, hooks, or custom agents. Do not make a plugin mandatory for the general decision skill.

A composite MCP tool is a prebuilt operation, not model-generated arbitrary code over all tools. Document that difference.

### 5. Subagents for parallel semantic work

Use Copilot custom agents, built-in task delegation, or fleet execution when independent subtasks require model judgment or separate context windows.

This is suitable for parallel research, codebase exploration, or independent reviews. It is not a token-saving substitute for deterministic programmatic calling because each subagent can make its own model calls and consume additional AI credits.

Require:

- disjoint subtask boundaries;
- bounded concurrency and depth;
- a small evidence-bearing report from each worker;
- deterministic aggregation where possible;
- explicit accounting for extra model calls and cost.

## Deterministic reduction boundary

A local script or composite tool may:

- validate schemas and select fields;
- filter by declared predicates;
- sort by explicit keys;
- group, join, count, calculate, and deduplicate;
- enforce page, threshold, and early-stop conditions;
- report exact omissions and failures.

Return to the model for semantic relevance, causation, risk, significance, ambiguous ranking, or conclusions that are not fully specified by the contract.

## Non-interactive CLI prompting is not the same feature

Copilot CLI supports non-interactive prompting through its prompt option. This makes the CLI callable from automation, but each invocation runs an agent task. It does not turn arbitrary Copilot tools into functions callable by generated code inside one model turn.

Avoid recursively invoking Copilot once per item for deterministic fan-out. That increases model calls and cost and weakens result and permission control. Use independent agent invocations only when each item genuinely requires model judgment and normal subagent facilities are unsuitable.

## Hooks do not provide the orchestration runtime

Hooks execute external commands at lifecycle points and are useful for:

- permission decisions;
- argument and output validation;
- audit logging and metrics;
- operation-budget enforcement;
- secret scanning;
- enforcing limits or blocking dangerous calls;
- cleanup and report generation.

Hooks should reinforce the selected route, but they do not let generated code synchronously invoke arbitrary Copilot tools and collect their results. Do not use hook re-entry or recursive prompts to imitate that runtime.

## Skills, scripts, and plugins

Agent Skills are the default distribution format for this guidance. Copilot skills can contain instructions, scripts, and resources, so users can adopt the decision procedure without another runtime.

Add a bundled script only when one deterministic operation recurs across tasks and can remain portable. Do not bundle a generic orchestration runtime merely to imitate a missing harness feature.

Use a Copilot plugin only when the package needs to distribute additional components such as:

- a composite MCP server configuration;
- hooks enforcing validation, budgets, or logging;
- custom agents for semantic fan-out;
- the skill itself as one installable unit.

Keep the standalone skill independently useful.

## Permissions

Copilot CLI supports allow and deny rules for shell, file, URL, and MCP tools.

- grant only the command, URL, path, or MCP operation required;
- prefer exact or narrow patterns over broad allow-all settings;
- deny destructive commands explicitly where practical;
- keep writes and external side effects approval-gated;
- do not pass secrets in prompts or generated scripts;
- validate local script arguments and outputs;
- preserve MCP server authorization independently of Copilot permissions.

## Evaluation

Compare the selected fallback with direct calls on representative tasks. Measure separately:

- correctness, completeness, and evidence coverage;
- underlying operations, including requests hidden inside scripts or composite tools;
- agent-visible tool calls;
- Copilot or subagent invocations and AI-credit use;
- transcript or context volume;
- latency and downstream service time;
- duplicates removed, cache hits, pages skipped, retries, and failures;
- implementation and maintenance complexity.

Keep the fallback only when the measured benefit justifies its operational and maintenance cost.

## Recommended fallback report

When native programmatic calling is unavailable, report:

```text
Native programmatic runtime: unavailable or undocumented
Selected fallback: native batch | local script | direct calls | composite MCP tool | subagents
Optimization target: underlying operations | agent-visible calls | model invocations | context | latency
Why this route is valid: ...
Native batch or aggregation available: yes | no | unknown
Semantic or approval boundary retained by direct calls: ...
Extra dependency, if any: ...
Feature differences from native programmatic calling: ...
Measured underlying operations and model invocations: ...
```

## Review checklist

- [ ] Current official Copilot documentation was checked for native capability changes.
- [ ] The skill remains directly usable as an Agent Skill without another runtime.
- [ ] The optimization target distinguishes downstream operations from agent-visible calls and model invocations.
- [ ] An existing native batch, aggregate, filtered, or projected operation was preferred where available.
- [ ] A local script is used only for shell-, library-, CLI-, or API-accessible operations.
- [ ] Scripts bound items, chunks, pages, concurrency, retries, duration, and early stopping.
- [ ] MCP-only tools are not falsely treated as callable from local code.
- [ ] A composite MCP tool is proposed only for a recurring stable operation.
- [ ] Deterministic reduction is separated from semantic interpretation.
- [ ] Subagents are reserved for semantic work and their model cost is acknowledged.
- [ ] Non-interactive Copilot prompting is not used as fake low-cost programmatic fan-out.
- [ ] Hooks enforce policy, budgets, or observability rather than recursively re-entering the agent.
- [ ] Shell and MCP permissions are narrowly scoped.
- [ ] Writes and irreversible actions retain explicit approval.
- [ ] The chosen fallback's differences from native programmatic calling are documented.
- [ ] The fallback was compared with direct calls using correctness, evidence, operations, model invocations, context, latency, and maintenance cost.
