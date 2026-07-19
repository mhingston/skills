# GitHub Copilot

Capability status: **no documented native hosted programmatic-tool-calling runtime equivalent; use Copilot-native capability fallbacks**

Last verified: 2026-07-19

Canonical sources:

- Copilot CLI overview: <https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview>
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

The official Copilot documentation reviewed on 2026-07-19 describes:

- ordinary agent tool use;
- shell, file, URL, and MCP tools;
- Agent Skills containing instructions, scripts, and resources;
- custom agents and parallel subagents;
- lifecycle hooks and installable plugins;
- non-interactive CLI prompting.

It does not document an OpenAI- or Anthropic-style hosted runtime where model-generated code can invoke arbitrary allowlisted agent or MCP tools repeatedly inside one model turn while keeping intermediate results outside model context.

Do not claim native feature parity unless newer official documentation establishes it.

## Route selection

Use this decision order.

### 1. Skill-bundled or task-local script for shell-accessible operations

Use a small script when every required operation is available through:

- existing project commands;
- safe local libraries already present in the repository;
- authenticated command-line tools;
- documented HTTP APIs that the environment is allowed to access.

This is the closest Copilot-native fallback for deterministic fan-out, filtering, aggregation, and validation. Agent Skills explicitly support supplementary scripts and resources, so the technique can remain packaged with the skill when the script is reusable.

The script must:

- have explicit parameters and structured output;
- cap item count, concurrency, retries, and duration;
- use safe argument handling rather than shell interpolation;
- keep credentials outside generated source;
- avoid writes unless separately approved;
- preserve source identifiers and partial failures;
- be removed after use unless it is intentionally retained as a reusable skill or project script.

This route uses Copilot's normal shell execution. It is not native programmatic tool calling, but it can perform many deterministic multi-call workloads without extra model turns between each operation.

### 2. Direct calls for MCP-only or harness-only tools

A local process cannot call an arbitrary Copilot or MCP tool merely because the agent can see it.

When the required operation exists only in the agent tool layer:

- use direct calls with an explicit call budget;
- batch requests only if the tool natively supports batching;
- reduce results between calls where the harness permits;
- preserve approval boundaries, source identifiers, and citations;
- stop rather than fabricating an unavailable code-to-tool bridge.

For a one-off or low-volume workflow, this is usually the correct route.

### 3. Purpose-built composite MCP tool for recurring workflows

For a stable, repeated, high-volume deterministic stage, create or adopt a narrow MCP tool that performs bounded fan-out and reduction behind one agent-visible call.

Examples:

- `fetch_issue_summaries(issue_numbers, concurrency)`;
- `compare_inventory(skus)`;
- `validate_repositories(repositories, checks)`.

Prefer a domain-specific composite tool over a generic `execute_code` or `invoke_any_tool` interface.

The MCP server should own:

- credentials and authorization;
- concurrency, retries, rate limiting, and timeouts;
- strict input and output schemas;
- idempotency and duplicate suppression;
- provenance and partial-failure reporting.

Copilot CLI can configure MCP servers directly. When distribution justifies it, a Copilot plugin can package the standalone skill with MCP configuration, hooks, or custom agents. Do not make a plugin mandatory for the general decision skill.

A composite MCP tool is a prebuilt operation, not model-generated arbitrary code over all tools. Document that difference.

### 4. Subagents for parallel semantic work

Use Copilot custom agents, built-in task delegation, or fleet execution when independent subtasks require model judgment or separate context windows.

This is suitable for parallel research, codebase exploration, or independent reviews. It is not a token-saving substitute for deterministic programmatic calling because each subagent can make its own model calls and consume additional AI credits.

Require:

- disjoint subtask boundaries;
- bounded concurrency and depth;
- a small evidence-bearing report from each worker;
- deterministic aggregation where possible;
- explicit accounting for extra model calls and cost.

## Non-interactive CLI prompting is not the same feature

Copilot CLI supports non-interactive prompting through its prompt option. This makes the CLI callable from automation, but each invocation runs an agent task. It does not turn arbitrary Copilot tools into functions callable by generated code inside one model turn.

Avoid recursively invoking Copilot once per item for deterministic fan-out. That increases model calls and cost and weakens result and permission control. Use independent agent invocations only when each item genuinely requires model judgment and normal subagent facilities are unsuitable.

## Hooks do not provide the orchestration runtime

Hooks execute external commands at lifecycle points and are useful for:

- permission decisions;
- argument and output validation;
- audit logging and metrics;
- secret scanning;
- enforcing limits or blocking dangerous calls;
- cleanup and report generation.

Hooks should reinforce the selected route, but they do not let generated code synchronously invoke arbitrary Copilot tools and collect their results. Do not use hook re-entry or recursive prompts to imitate that runtime.

## Skills, scripts, and plugins

Agent Skills are the default distribution format for this guidance. Copilot skills can contain instructions, scripts, and resources, so users can adopt the decision procedure without another runtime.

Add a bundled script only when one deterministic operation recurs across tasks and can remain portable. Do not bundle a generic orchestration runtime merely to imitate a missing harness feature.

Use a Copilot plugin only when the package needs to distribute additional components such as:

- a composite MCP server configuration;
- hooks enforcing validation or logging;
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

## Recommended fallback report

When native programmatic calling is unavailable, report:

```text
Native programmatic runtime: unavailable or undocumented
Selected fallback: local script | direct calls | composite MCP tool | subagents
Why this route is valid: ...
Semantic or approval boundary retained by direct calls: ...
Extra dependency, if any: ...
Feature differences from native programmatic calling: ...
```

## Review checklist

- [ ] Current official Copilot documentation was checked for native capability changes.
- [ ] The skill remains directly usable as an Agent Skill without another runtime.
- [ ] A local script is used only for shell-, library-, CLI-, or API-accessible operations.
- [ ] MCP-only tools are not falsely treated as callable from local code.
- [ ] A composite MCP tool is proposed only for a recurring stable operation.
- [ ] Subagents are reserved for semantic work and their model cost is acknowledged.
- [ ] Non-interactive Copilot prompting is not used as fake low-cost programmatic fan-out.
- [ ] Hooks enforce policy or observability rather than recursively re-entering the agent.
- [ ] Shell and MCP permissions are narrowly scoped.
- [ ] Writes and irreversible actions retain explicit approval.
- [ ] The chosen fallback's differences from native programmatic calling are documented.
