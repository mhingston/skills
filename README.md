# Agent Skills

A catalogue of reusable **agent skills** and **orchestrating agent definitions**
for software engineering, learning, workflow improvement, and accountable
AI-assisted delivery.

The repository is intended to be named `agent-skills`: skills remain portable
implementation modules, while agents provide opinionated public workflows that
coordinate those modules without collapsing their responsibility boundaries.

## Repository structure

```text
agents/
  <agent-name>.md          # orchestration and workflow state

<skill-name>/
  SKILL.md                 # public skill or workflow-internal module
  references/              # optional skill-local support material
```

### Agents

Agents coordinate multiple stages, choose proportionate workflows, maintain
state, and return control to humans or calling systems at explicit boundaries.
An agent may invoke internal skill modules, but that does not make those skills
public entry points. It must not silently weaken their safety constraints or
manufacture work assigned to a human.

### Skills

Skills are focused, reusable modules. Public skills may be invoked directly.
Workflow-internal skills sit behind an agent's interface, remain independently
packaged, and must fail closed or route to their owning agent when a harness
cannot hide direct invocation.

## Packaging rule

Every skill is self-contained. A skill can be copied or installed by copying its
own directory only.

- The entry point is `<skill-name>/SKILL.md`.
- Supporting files, when needed, live under that skill's own
  `<skill-name>/references/` directory.
- A skill must not depend on files in a parent directory, a repository-level
  shared folder, another skill's directory, or an agent definition.
- Small pieces of process guidance may be intentionally duplicated between
  skills so each package remains portable and independently loadable.
- A workflow-internal skill must declare `user-invocable: false` where the target
  runtime supports it and state its invocation contract in the body. It must not
  execute when called without its owning agent's required context.

Agent definitions are orchestration artefacts and may require internal skill
modules. Harness-specific copies may be generated from the canonical definitions
under `agents/`, but skill directories must not read files from an agent package.

## Agent catalogue

| Agent | Use it for |
| --- | --- |
| [`implement`](agents/implement.md) | Orchestrate a ready ticket through a ticket-keyed feature branch, delegated RED/GREEN TDD implementation, independent technical review, full build/test gates, and pull-request creation. |
| [`pr-review`](agents/pr-review.md) | Coordinate proportionate PR explanation, human-verdict preparation, explicit human input, and revision-bound verdict recording without approving or merging. |
| [`refine`](agents/refine.md) | Classify selected work, clarify unresolved decisions, refine one bounded ticket or split larger clear work into agent-ready vertical slices, resolve where new tickets belong, and update the selected tracker after human approval. |

## Public skill catalogue

| Skill | Use it for |
| --- | --- |
| [`adopt`](adopt/SKILL.md) | Compare the current codebase with another project or idea and identify high-value, low-friction patterns worth adapting. |
| [`audit-me`](audit-me/SKILL.md) | Audit recurring work and connected work surfaces for dropped commitments, fragmented context, and automation opportunities. |
| [`coach-me`](coach-me/SKILL.md) | Analyse how a user collaborates with advanced models and produce focused coaching and a personalised AI working manual. |
| [`create-pr`](create-pr/SKILL.md) | Investigate a branch, gather proportionate evidence, assess comprehension risk, and create one reviewable pull request without approving or merging it. |
| [`git-archaeologist`](git-archaeologist/SKILL.md) | Use repository history to identify ownership patterns, defect hotspots, maintenance risk, and investigation priorities. |
| [`lsp-config`](lsp-config/SKILL.md) | Detect repository languages and safely reconcile GitHub Copilot CLI LSP configuration and VS Code extension recommendations. |
| [`programmatic-tool-calling`](programmatic-tool-calling/SKILL.md) | Design bounded multi-tool orchestration with native programmatic runtimes or safe script, MCP, direct-call, and subagent fallbacks. |
| [`review`](review/SKILL.md) | Perform a standalone, read-only technical review across correctness, security, spec alignment, tests, and design. |
| [`repository-ontology`](repository-ontology/SKILL.md) | Assess whether a repository needs an ontology, establish the smallest evidence-backed model, and validate its usefulness for people and agents. |
| [`session-lessons`](session-lessons/SKILL.md) | Analyse multiple sessions for recurring friction and effective patterns that deserve durable codification. |
| [`skill-creator`](skill-creator/SKILL.md) | Create new skills, modify and improve existing skills, and measure skill performance. |
| [`teach-me`](teach-me/SKILL.md) | Run measured tutoring, review, and learning-coach loops with durable receipts, spaced retrieval, misconceptions, and transfer evidence. |

## Workflow-internal skill modules

These modules are implementation details of public agent workflows, not public
entry points:

| Module | Owning agent | Owned stage |
| --- | --- | --- |
| [`implement-ticket`](implement-ticket/SKILL.md) | `implement` | Implement or remediate one bounded ticket with observable RED/GREEN TDD evidence, leaving review, commit, push, and PR creation to the agent. |
| [`explain-diff`](explain-diff/SKILL.md) | `pr-review` | Build a causal explainer after the agent classifies comprehension risk as moderate or high. |
| [`human-verdict-gate`](human-verdict-gate/SKILL.md) | `pr-review` | Prepare the revision-specific decision packet after any required explainer. |
| [`record-verdict`](record-verdict/SKILL.md) | `pr-review` | Persist the human verdict only after the human stop and a fresh head-SHA check. |
| [`refine-ticket`](refine-ticket/SKILL.md) | `refine` | Assess and draft one bounded work item against the agent-ready readiness contract. |
| [`split-work`](split-work/SKILL.md) | `refine` | Decompose a clear multi-ticket outcome into vertical slices and an acyclic dependency graph. |

Each carries `user-invocable: false`. This field is a runtime extension, not a
portable guarantee of the base Agent Skills format. Runtimes that support it
hide the module from the user-facing command menu while leaving it available to
the owning agent. Other harness adapters must enforce equivalent visibility;
the modules' own invocation contracts also refuse direct execution without the
owning agent's context.

## Ticket implementation workflow

The `implement` agent is the public entry point for shipping one ready ticket.
It adds one internal implementation module and reuses the existing public
`review` and `create-pr` skills instead of duplicating their responsibilities:

```text
ingest canonical ticket and verify readiness
                    ↓
create feature/<TICKET-KEY> from the pinned base
                    ↓
implement-ticket in a fresh worker — observe RED, then GREEN
                    ↓
review in a separate fresh worker
                    ↓
[blocker or major only] implement-ticket remediation, then re-review
                    ↓
complete project tests and build must pass after the last code change
                    ↓
commit and push the reviewed revision
                    ↓
create-pr — inspect the committed diff and open the PR
```

The coordinator never edits product code or reviews its own implementation.
Missing requirements route back to refinement, while failed or unavailable
build and test gates stop before PR creation. Repository-controlled commands run
only behind an explicit credential and network isolation boundary. The exact
branch name contains the ticket key only, such as `feature/PAY-1234`.

## Work-refinement workflow

The `refine` agent is the only public entry point for selected-work refinement.
It distinguishes one bounded ticket, clear multi-ticket work, and work that is
still too uncertain to split:

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

`refine-ticket` owns the single-item readiness assessment and durable rewrite.
`split-work` owns vertical slicing and dependency-graph design but returns only
drafts. Before invoking it, the agent resolves a concrete publication target
from the source, explicit user direction, or canonical repository configuration;
when none is unambiguous, it offers only connected writable destinations plus a
draft-only fallback. The agent then refines every child before publication,
keeps unresolved fog out of implementation tickets, and owns all tracker
mutations.

## Pull-request review workflow

The `pr-review` agent provides one coherent entry point while preserving the
change-review skills as separate responsibility boundaries:

```text
agent implementation and local verification
                    ↓
create-pr — assemble evidence and create the review surface
                    ↓
pr-review agent begins
                    ↓
[moderate/high comprehension risk only]
explain-diff — build a causal mental model
                    ↓
human-verdict-gate — always prepare the current decision packet
                    ↓
STOP — human personally explains and chooses a verdict
                    ↓
fresh head-SHA check
                    ↓
record-verdict — persist the decision against the exact PR revision, last
```

`create-pr` normally sits before the review agent because it belongs to the
authoring and handoff lifecycle and remains a public skill. The three internal
review modules are installed with `pr-review` but are not invoked independently.

The public [`review`](review/SKILL.md) skill is separate from this accountable
verdict workflow. It produces a read-only technical findings report for code
changes but does not prepare, infer, or record a human verdict.

### Review artefacts

The agent keeps the explainer, human-verdict packet, resumable checkpoint,
temporary comment body, and optional local verdict record together. It prefers
`.agent-artifacts/pr-review/<owner>-<repository>-pr-<number>/` only after Git
confirms that path is ignored and untracked. This repository includes
`.agent-artifacts/` in [`.gitignore`](.gitignore) as the recommended convention.

The agent never changes a target repository's ignore rules during review. When
the convention is absent, it uses a harness-managed artefact directory outside
the repository instead. Git ignore reduces accidental commits; it does not
protect sensitive review content from local access.

### `pr-review`: coordinate the review lifecycle

Use after a pull request exists. It pins the current head SHA, reconstructs the
review frame, classifies consequence and comprehension risk, invokes the
lightest proportionate companion skills, stops for explicit human input, and
records the supplied verdict only when it still applies to the reviewed
revision.

It coordinates evidence and comprehension; it does not approve, merge, deploy,
or manufacture a human decision.

### `create-pr`: make the change reviewable

Use when a branch is ready to become a pull request. It inspects the complete
change, traces behaviour and likely blast radius, records exact verification
results and limitations, and identifies when deeper explanation is warranted.

It creates evidence, not approval.

### `explain-diff`: make the change understandable

The agent invokes this when a reviewer needs more than a concise PR description.
It teaches previous and new behaviour, invariants, runtime or data flow, failure
modes, trade-offs, and extension points. Understanding checks and explain-back
prompts support reflection; they do not prove correctness.

### `human-verdict-gate`: make the decision judgeable

The agent always invokes this immediately before a consequential decision. It
revalidates the current revision, evidence, checks, review state, unresolved
concerns, operational readiness, and comprehension evidence. It leaves
explain-back, risk acceptance, and verdict fields for the accountable human.

### `record-verdict`: make the human decision durable

The agent invokes this last, only after a human explicitly supplies the decision,
rationale, evidence assessment, and accepted risks and the head SHA is checked
again. It binds the record to the exact PR head SHA and creates or updates a
canonical GitHub comment idempotently. A later commit makes an older record
stale.

`record-verdict` deliberately does not approve, merge, or deploy. Its JSON
Schema and comment template are packaged inside
[`record-verdict/references/`](record-verdict/references/).

## Design principles

1. Evidence is not approval.
2. Explanation is not proof of correctness.
3. Model-generated rationale is not human judgment.
4. A verdict applies only to the exact revision reviewed.
5. Green checks cannot silently replace explicit risk acceptance.
6. Automation may enforce a recorded verdict, but it must not invent one.
7. Use the lightest skill and artefact proportionate to the task and risk.
8. Agents coordinate capabilities; they do not erase responsibility boundaries.
9. Portability and correct skill-loading boundaries take priority over avoiding
   small amounts of duplicated guidance.

## Installation and use

Copy each required public skill directory into the skill location used by your
agent harness. Do not copy any parent-level support folder; there should not be
one.

Install or adapt canonical agent definitions from `agents/` separately according
to the harness's agent format. Public skills remain directly invocable. To use
`pr-review`, install its agent definition together with `explain-diff`,
`human-verdict-gate`, and `record-verdict`, then expose only the `pr-review`
agent as the review entry point. To use `refine`, install its agent definition
together with `refine-ticket` and `split-work`, then expose only the `refine`
agent as the refinement entry point.

Examples:

```text
create-pr/
└── SKILL.md

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

Agent and skill support varies between products. The Markdown files are intended
to serve as executable guidance, portable source material for harness-specific
configuration, and reviewable process documentation.
