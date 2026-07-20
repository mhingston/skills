# Agent Skills

A catalogue of reusable **agent skills** and **orchestrating agent definitions** for software engineering, learning, workflow improvement, and accountable AI-assisted delivery.

Skills remain portable implementation modules. Agents provide opinionated public workflows that coordinate those modules without collapsing responsibility boundaries.

## Repository structure

```text
agents/
  <agent-name>.md          # orchestration and workflow state

<skill-name>/
  SKILL.md                 # public skill or workflow-internal module
  references/              # optional skill-local support material
```

### Agents

Agents coordinate multiple stages, choose proportionate workflows, maintain state, and return control to humans or calling systems at explicit boundaries. An agent may invoke internal skill modules, but that does not make those skills public entry points. It must not silently weaken their safety constraints or manufacture work assigned to a human.

### Skills

Skills are focused, reusable modules. Public skills may be invoked directly. Workflow-internal skills sit behind an agent's interface, remain independently packaged, and must fail closed or route to their owning agent when a harness cannot hide direct invocation.

## Packaging rule

Every skill is self-contained. A skill can be copied or installed by copying its own directory only.

- The entry point is `<skill-name>/SKILL.md`.
- Supporting files, when needed, live under that skill's own `<skill-name>/references/` directory.
- A skill must not depend on files in a parent directory, a repository-level shared folder, another skill's directory, or an agent definition.
- Small pieces of process guidance may be intentionally duplicated between skills so each package remains portable and independently loadable.
- A workflow-internal skill must declare `user-invocable: false` where the target runtime supports it and state its invocation contract in the body.
- An internal skill must not execute when called without its owning agent's required context.

Agent definitions are orchestration artefacts and may require public or internal skill modules. Harness-specific copies may be generated from the canonical definitions under `agents/`, but skill directories must not read files from an agent package.

## Agent catalogue

| Agent | Use it for |
| --- | --- |
| [`implement`](agents/implement.md) | Orchestrate a ready ticket through a ticket-keyed feature branch, delegated RED/GREEN TDD implementation, independent technical review, full build/test gates, and pull-request creation. |
| [`pr-review`](agents/pr-review.md) | Require a current independent technical review and revision-bound risk map, provide proportionate comprehension support, prepare explicit human judgement, and record the human verdict without approving or merging. |
| [`refine`](agents/refine.md) | Classify selected work, clarify unresolved decisions, refine one bounded ticket or split larger clear work into agent-ready vertical slices, resolve where new tickets belong, and update the selected tracker after human approval. |

## Public skill catalogue

| Skill | Use it for |
| --- | --- |
| [`adopt`](adopt/SKILL.md) | Transfer evidence-backed mechanisms from an external project, product, article, paper, workflow, or operating model into a specific repository, service, customer journey, team, or organisation. |
| [`audit-me`](audit-me/SKILL.md) | Audit recurring work and connected work surfaces for dropped commitments, fragmented context, and automation opportunities. |
| [`coach-me`](coach-me/SKILL.md) | Analyse how a user collaborates with advanced models and produce focused coaching and a personalised AI working manual. |
| [`create-pr`](create-pr/SKILL.md) | Inspect a committed branch, carry current technical-risk evidence into a behaviour-first PR description, and create one reviewable pull request without approving or merging it. |
| [`git-archaeologist`](git-archaeologist/SKILL.md) | Use repository history to identify ownership patterns, defect hotspots, maintenance risk, and investigation priorities. |
| [`lsp-config`](lsp-config/SKILL.md) | Detect repository languages and safely reconcile GitHub Copilot CLI LSP configuration and VS Code extension recommendations. |
| [`programmatic-tool-calling`](programmatic-tool-calling/SKILL.md) | Design bounded multi-tool orchestration with native programmatic runtimes or safe script, MCP, direct-call, and subagent fallbacks. |
| [`review`](review/SKILL.md) | Perform a standalone read-only review using baseline and change-specific dimensions, independently falsify candidate findings, and produce a revision-bound technical risk map. |
| [`repository-ontology`](repository-ontology/SKILL.md) | Assess whether a repository needs an ontology, establish the smallest evidence-backed model, and validate its usefulness for people and agents. |
| [`session-lessons`](session-lessons/SKILL.md) | Analyse multiple sessions for recurring friction and effective patterns that deserve durable codification. |
| [`skill-creator`](skill-creator/SKILL.md) | Create new skills, modify and improve existing skills, and measure skill performance. |
| [`teach-me`](teach-me/SKILL.md) | Run measured tutoring, review, and learning-coach loops with durable receipts, spaced retrieval, misconceptions, and transfer evidence. |

## Workflow-internal skill modules

These modules are implementation details of public agent workflows, not public entry points:

| Module | Owning agent | Owned stage |
| --- | --- | --- |
| [`implement-ticket`](implement-ticket/SKILL.md) | `implement` | Implement or remediate one bounded ticket with observable RED/GREEN TDD evidence, leaving review, commit, push, and PR creation to the agent. |
| [`explain-diff`](explain-diff/SKILL.md) | `pr-review` | Build a causal explainer after the agent classifies comprehension risk as moderate or high. |
| [`human-verdict-gate`](human-verdict-gate/SKILL.md) | `pr-review` | Turn the current technical review, risk map, and comprehension evidence into a revision-specific packet with unanswered human fields. |
| [`record-verdict`](record-verdict/SKILL.md) | `pr-review` | Persist the human verdict and explicit dispositions for every material mapped risk after a fresh head-SHA check. |
| [`refine-ticket`](refine-ticket/SKILL.md) | `refine` | Assess and draft one bounded work item against the agent-ready readiness contract. |
| [`split-work`](split-work/SKILL.md) | `refine` | Decompose a clear multi-ticket outcome into vertical slices and an acyclic dependency graph. |

Each internal module carries `user-invocable: false`. This field is a runtime extension, not a portable guarantee of the base Agent Skills format. Runtimes that support it should hide the module from the user-facing command menu while leaving it available to the owning agent. Other harness adapters must enforce equivalent visibility; each module's invocation contract also refuses direct execution without the owning agent's context.

## Ticket implementation workflow

The `implement` agent is the public entry point for shipping one ready ticket. It adds one internal implementation module and reuses the public `review` and `create-pr` skills:

```text
ingest canonical ticket and verify readiness
                    ↓
create feature/<TICKET-KEY> from the pinned base
                    ↓
implement-ticket in a fresh worker — observe RED, then GREEN
                    ↓
review in a separate fresh worker
  baseline + justified change-specific dimensions
  validated findings + revision-bound risk map
                    ↓
[blocker or major only] implement-ticket remediation, then re-review
                    ↓
complete project tests and build must pass after the last code change
                    ↓
commit and push the reviewed revision
                    ↓
create-pr — inspect the committed diff and carry current risk evidence into the PR
```

The coordinator never edits product code or reviews its own implementation. Missing requirements route back to refinement, while failed or unavailable build and test gates stop before PR creation. Repository-controlled commands run only behind an explicit credential and network isolation boundary. The exact branch name contains the ticket key only, such as `feature/PAY-1234`.

## Work-refinement workflow

The `refine` agent is the only public entry point for selected-work refinement. It distinguishes one bounded ticket, clear multi-ticket work, and work that is still too uncertain to split:

```text
inspect and classify selected work
                    ↓
       ┌────────────┼────────────┐
       ↓            ↓            ↓
 refine-ticket   discovery    split-work
       ↓            ↓            ↓
       │       reclassify    refine-ticket for
       │                    every proposed child
       └────────────┬────────────┘
                    ↓
         explicit human approval
                    ↓
       tracker write, read-back, verify
```

`refine-ticket` owns the single-item readiness assessment and durable rewrite. `split-work` owns vertical slicing and dependency-graph design but returns only drafts. Before invoking it, the agent resolves a concrete publication target from the source, explicit user direction, or canonical repository configuration. When none is unambiguous, it offers only connected writable destinations plus a draft-only fallback. The agent refines every child before publication, keeps unresolved fog out of implementation tickets, and owns all tracker mutations.

## Pull-request review workflow

The `pr-review` agent provides one accountable entry point while preserving technical review, comprehension, and human judgement as separate responsibility boundaries:

```text
agent implementation and local verification
                    ↓
create-pr — create the review surface and carry any current risk summary
                    ↓
pr-review pins the exact base and head revision
                    ↓
reuse a current independent review only when it matches that revision
otherwise invoke review in a fresh context
                    ↓
review — baseline + change-specific dimensions
       — independent falsification of candidate findings
       — compound-risk synthesis
       — revision-bound risk map
                    ↓
[moderate/high comprehension risk only]
explain-diff — build a causal mental model around important paths and risks
                    ↓
human-verdict-gate — prepare the current decision packet and leave human fields empty
                    ↓
STOP — human personally explains, disposes every material risk, and chooses a verdict
                    ↓
fresh head-SHA check
                    ↓
record-verdict — persist the decision and risk dispositions against the exact revision
```

`create-pr` normally sits before the review agent because it belongs to the authoring and handoff lifecycle and remains a public skill. The public `review` skill is mandatory evidence production for `pr-review`, but it does not prepare, infer, or record a human verdict. The three internal modules are installed with `pr-review` and are not invoked independently.

### Risk map

The `review` skill keeps technical severity, confidence, likelihood, repository policy thresholds, and technical disposition separate. Its risk map routes attention using dispositions such as:

- remediate before merge;
- human attention required;
- specialist review required;
- explicit risk acceptance;
- redirect to design;
- track as debt;
- informational.

These are technical outputs, not approval. `human-verdict-gate` requires the accountable human to explicitly mark every material risk as remediated, accepted, accepted with conditions, deferred, rejected as unsupported, redirected, or blocked pending evidence or specialist review.

### Review artefacts

The agent keeps the technical report, machine-readable risk map, explainer, human-verdict packet, resumable checkpoint, temporary comment body, and optional local verdict record together.

It prefers `.agent-artifacts/pr-review/<owner>-<repository>-pr-<number>/` only after Git confirms that path is ignored and untracked. This repository includes `.agent-artifacts/` in [`.gitignore`](.gitignore) as the recommended convention.

The agent never changes a target repository's ignore rules during review. When the convention is absent, it uses a harness-managed artefact directory outside the repository instead. Git ignore reduces accidental commits; it does not protect sensitive review content from local access.

### `review`: map technical risk

Use standalone for a read-only technical review, or let `pr-review` invoke it against the pinned PR revision. It always covers correctness, security, specification alignment, tests, and design, then adds only change-specific dimensions justified by the change topology. Candidate findings must survive an explicit falsification pass before entering the risk map.

### `pr-review`: coordinate accountable review

Use after a pull request exists. It pins the current head SHA, reconstructs the review frame, requires a current technical report and risk map, classifies consequence and comprehension risk, invokes the lightest proportionate comprehension support, stops for explicit human input, and records the supplied verdict only when it still applies to the reviewed revision.

It coordinates evidence and comprehension; it does not approve, merge, deploy, or manufacture a human decision.

### `create-pr`: make the change reviewable

Use when a branch is ready to become a pull request. It inspects the complete committed change, traces behaviour and likely blast radius, records exact verification results and limitations, carries a current risk-map summary when supplied, and identifies when deeper explanation is warranted.

It creates evidence, not approval.

### `explain-diff`: make the change understandable

The agent invokes this when a reviewer needs more than a concise PR description. It teaches previous and new behaviour, invariants, runtime or data flow, failure modes, risk interactions, trade-offs, and extension points. Understanding checks and explain-back prompts support reflection; they do not prove correctness.

### `human-verdict-gate`: make the decision judgeable

The agent invokes this immediately before a consequential decision. It revalidates the current revision, technical report, risk map, checks, review state, unresolved concerns, operational readiness, policy thresholds, authority, and comprehension evidence. It leaves explain-back, risk dispositions, risk acceptance, and verdict fields for the accountable human.

### `record-verdict`: make human judgement durable

The agent invokes this last, only after a human explicitly supplies the decision, personal explanation, evidence assessment, disposition for every material risk, accepted residual risk, rationale, and conditions, and the head SHA is checked again.

It binds the record to the exact PR head SHA and creates or updates a canonical GitHub comment idempotently. A later commit makes the verdict and every recorded risk disposition stale. It deliberately does not approve, merge, or deploy. Its versioned JSON Schema and comment template are packaged inside [`record-verdict/references/`](record-verdict/references/).

## Design principles

1. Evidence is not approval.
2. Explanation is not proof of correctness.
3. Technical severity is not policy disposition.
4. A policy threshold is not a human verdict.
5. Model-generated rationale or risk acceptance is not human judgement.
6. A review artefact or verdict applies only to the exact revision it names.
7. Green checks cannot silently replace explicit risk acceptance.
8. Automation may enforce a recorded verdict, but it must not invent one.
9. Baseline review dimensions prevent dynamic coverage from omitting mundane risks.
10. Change-specific dimensions should be justified by topology, boundaries, or invariants.
11. Candidate findings should be challenged before publication.
12. Use the lightest skill and artefact proportionate to the task and risk.
13. Agents coordinate capabilities; they do not erase responsibility boundaries.
14. Portability and correct skill-loading boundaries take priority over avoiding small amounts of duplicated guidance.

## Installation and use

Copy each required public skill directory into the skill location used by your agent harness. Do not copy any parent-level support folder; there should not be one.

Install or adapt canonical agent definitions from `agents/` separately according to the harness's agent format. Public skills remain directly invocable.

To use `pr-review`, install:

```text
review/
├── SKILL.md
└── references/
    ├── lenses.md
    └── report-contract.md

agents/
└── pr-review.md

explain-diff/
└── SKILL.md                 # internal: user-invocable false

human-verdict-gate/
└── SKILL.md                 # internal: user-invocable false

record-verdict/
├── SKILL.md                 # internal: user-invocable false
└── references/
    ├── verdict-comment-template.md
    └── verdict-record.schema.json
```

Expose only the `pr-review` agent as the accountable verdict entry point. `review` remains public for standalone technical reviews.

To use `refine`, install its agent definition together with `refine-ticket` and `split-work`, then expose only the `refine` agent as the refinement entry point.

Agent and skill support varies between products. The Markdown files are intended to serve as executable guidance, portable source material for harness-specific configuration, and reviewable process documentation.