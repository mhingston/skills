# Agent Skills

A catalogue of reusable **agent skills** and **orchestrating agent definitions**
for software engineering, learning, workflow improvement, and accountable
AI-assisted delivery.

The repository is intended to be named `agent-skills`: skills remain portable,
independently loadable capabilities, while agents provide opinionated workflows
that coordinate those capabilities without collapsing their boundaries.

## Repository structure

```text
agents/
  <agent-name>.md          # orchestration and workflow state

<skill-name>/
  SKILL.md                 # independently installable skill
  references/              # optional skill-local support material
```

### Agents

Agents coordinate multiple stages, choose proportionate workflows, maintain
state, and return control to humans or calling systems at explicit boundaries.
An agent may refer to companion skills, but it must not silently weaken their
safety constraints or manufacture work assigned to a human.

### Skills

Skills are focused, reusable capabilities. Every skill is self-contained and
must remain useful when installed without any agent or companion skill.

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
- Skills may mention companion skills as optional workflow stages, but they must
  still behave safely and usefully when installed alone.

Agent definitions are orchestration artefacts rather than skill dependencies.
Harness-specific copies may be generated from the canonical definitions under
`agents/`, but the skill directories must not rely on them.

## Agent catalogue

| Agent | Use it for |
| --- | --- |
| [`pr-review`](agents/pr-review.md) | Coordinate proportionate PR explanation, human-verdict preparation, explicit human input, and revision-bound verdict recording without approving or merging. |

## Skill catalogue

| Skill | Use it for |
| --- | --- |
| [`adopt`](adopt/SKILL.md) | Compare the current codebase with another project or idea and identify high-value, low-friction patterns worth adapting. |
| [`audit-me`](audit-me/SKILL.md) | Audit recurring work and connected work surfaces for dropped commitments, fragmented context, and automation opportunities. |
| [`coach-me`](coach-me/SKILL.md) | Analyse how a user collaborates with advanced models and produce focused coaching and a personalised AI working manual. |
| [`create-pr`](create-pr/SKILL.md) | Investigate a branch, gather proportionate evidence, assess comprehension risk, and create one reviewable pull request without approving or merging it. |
| [`deep-learning`](deep-learning/SKILL.md) | Turn passive study into active understanding through explanation, retrieval, diagnosis, application, and reinforcement. |
| [`explain-diff`](explain-diff/SKILL.md) | Build a causal, interactive mental model of a diff, commit, branch, or pull request so a reader can reason about and participate in future work. |
| [`git-archaeologist`](git-archaeologist/SKILL.md) | Use repository history to identify ownership patterns, defect hotspots, maintenance risk, and investigation priorities. |
| [`human-verdict-gate`](human-verdict-gate/SKILL.md) | Prepare a revision-specific decision packet for an accountable human without choosing, recording, or implying the verdict. |
| [`lsp-config-sync`](lsp-config-sync/SKILL.md) | Detect repository languages and safely reconcile GitHub Copilot CLI LSP configuration and VS Code extension recommendations. |
| [`record-verdict`](record-verdict/SKILL.md) | Persist an explicitly human-supplied verdict against the exact pull-request revision as a structured, idempotent GitHub record. |
| [`repository-ontology`](repository-ontology/SKILL.md) | Assess whether a repository needs an ontology, establish the smallest evidence-backed model, and validate its usefulness for people and agents. |
| [`session-lessons`](session-lessons/SKILL.md) | Analyse multiple sessions for recurring friction and effective patterns that deserve durable codification. |
| [`skill-creator`](skill-creator/SKILL.md) | Create new skills, modify and improve existing skills, and measure skill performance. |

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
explain-diff — build a causal mental model when proportionate
                    ↓
human-verdict-gate — prepare the current decision packet
                    ↓
human personally explains and chooses a verdict
                    ↓
record-verdict — persist the decision against the exact PR revision
```

`create-pr` normally sits before the review agent because it belongs to the
authoring and handoff lifecycle. Every stage can still be installed and invoked
independently.

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

Use when a reviewer needs more than a concise PR description. It teaches
previous and new behaviour, invariants, runtime or data flow, failure modes,
trade-offs, and extension points. Understanding checks and explain-back prompts
support reflection; they do not prove correctness.

### `human-verdict-gate`: make the decision judgeable

Use immediately before a consequential decision. It revalidates the current
revision, evidence, checks, review state, unresolved concerns, operational
readiness, and comprehension evidence. It leaves explain-back, risk acceptance,
and verdict fields for the accountable human.

### `record-verdict`: make the human decision durable

Use only after a human explicitly supplies the decision, rationale, evidence
assessment, and accepted risks. It binds the record to the exact PR head SHA and
creates or updates a canonical GitHub comment idempotently. A later commit makes
an older record stale.

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

Copy each required skill directory into the skill location used by your agent
harness. Do not copy any parent-level support folder; there should not be one.

Install or adapt canonical agent definitions from `agents/` separately according
to the harness's agent format. An agent definition is optional: users and
systems may invoke the skills directly.

Examples:

```text
create-pr/
└── SKILL.md

record-verdict/
├── SKILL.md
└── references/
    ├── verdict-comment-template.md
    └── verdict-record.schema.json

agents/
└── pr-review.md
```

Agent and skill support varies between products. The Markdown files are intended
to serve as executable guidance, portable source material for harness-specific
configuration, and reviewable process documentation.
