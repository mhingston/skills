# Agent Skills

A catalogue of reusable **Agent Skills** and orchestrating agent definitions for
software engineering, learning, workflow improvement, and accountable
AI-assisted delivery.

Skills are portable procedure packages. Agents coordinate skills, lifecycle,
state, delegation, and human responsibility boundaries.

## Repository structure

```text
agents/
  <agent-name>.md          # orchestration and workflow state

<skill-name>/
  SKILL.md                 # canonical Agent Skills entry point
  references/              # optional, loaded on demand
  scripts/                 # optional deterministic helpers
  assets/                  # optional output resources
```

## Packaging rules

Every skill is self-contained and can be installed by copying its own directory.

- The entry point is `<skill-name>/SKILL.md`.
- Supporting files live inside that skill's directory.
- A skill must not depend on a repository-level shared folder, parent path,
  another skill's directory, or an agent definition.
- Small process guidance may be duplicated when that preserves portability.
- Relative references should be direct from `SKILL.md`; avoid nested reference
  chains.
- Keep active `SKILL.md` instructions under 500 lines. Move optional detail into
  focused references.

Canonical frontmatter uses only specification fields:

```yaml
---
name: skill-name
description: What the skill does and when to use it.
license: Apache-2.0                # optional
compatibility: Requires git ...   # optional
metadata:                         # optional string mapping
  example.key: "value"
allowed-tools: Bash(git:*) Read   # optional, experimental
---
```

Runtime-specific properties must not be added as new top-level fields to the
canonical skill. Store portable extension information under namespaced
`metadata`, then translate it into a generated harness adapter when needed.

## Public and internal skills

Public skills may be invoked directly. Workflow-internal modules sit behind an
agent interface and fail closed without the owning agent's orchestration state.

Internal modules use canonical metadata such as:

```yaml
metadata:
  mhingston.internal: "true"
  mhingston.owner-agent: "pr-review"
  mhingston.user-invocable: "false"
```

This metadata communicates intent but is not an authorization boundary. The
module's body must still require its owning agent's exact context and return
`REQUIRED_ORCHESTRATOR_CONTEXT` when invoked directly. A runtime adapter may map
the metadata to its native visibility mechanism.

## Agent catalogue

| Agent | Use it for |
| --- | --- |
| [`implement`](agents/implement.md) | Orchestrate a ready ticket through a ticket-keyed feature branch, delegated RED/GREEN TDD implementation, independent technical review, full build/test gates, and pull-request creation. |
| [`pr-review`](agents/pr-review.md) | Require a current independent technical review and revision-bound risk map, provide proportionate comprehension support, redirect unresolved architecture decisions upstream, prepare explicit human judgement, and record the human verdict without approving or merging. |
| [`refine`](agents/refine.md) | Classify selected work, clarify unresolved decisions, refine one bounded ticket or split larger clear work into agent-ready vertical slices, resolve publication targets, and update the selected tracker after human approval. |

## Public skill catalogue

| Skill | Use it for |
| --- | --- |
| [`adopt`](adopt/SKILL.md) | Transfer evidence-backed mechanisms from an external source into a concrete target context. |
| [`audit-me`](audit-me/SKILL.md) | Audit recurring work and connected work surfaces for dropped commitments, fragmented context, and automation opportunities. |
| [`coach-me`](coach-me/SKILL.md) | Analyse the current user's real AI-session evidence and produce focused coaching and a personalised working manual. |
| [`contributor-analysis`](contributor-analysis/SKILL.md) | Find evidence-backed reviewer candidates, stewardship coverage, onboarding contacts, and continuity questions without profiling people or ranking performance. |
| [`create-pr`](create-pr/SKILL.md) | Inspect a committed branch, carry current technical-risk evidence into a behaviour-first PR description, and create one reviewable pull request. |
| [`git-archaeologist`](git-archaeologist/SKILL.md) | Use calibrated repository-history signals to prioritise deeper code, ownership, and operational investigation. |
| [`lsp-config`](lsp-config/SKILL.md) | Detect repository languages and safely reconcile GitHub Copilot CLI LSP configuration and VS Code recommendations. |
| [`programmatic-tool-calling`](programmatic-tool-calling/SKILL.md) | Design bounded multi-tool orchestration with native programmatic runtimes or safe fallbacks. |
| [`review`](review/SKILL.md) | Perform a standalone read-only review, falsify candidate findings, record reviewer provenance, and produce a revision-bound technical risk map. |
| [`review-calibration`](review-calibration/SKILL.md) | Evaluate historical review evidence and propose reversible, human-governed changes to dimensions, thresholds, falsification, and reviewer routing. |
| [`repository-ontology`](repository-ontology/SKILL.md) | Assess whether a repository needs an ontology and establish the smallest evidence-backed semantic model. |
| [`session-lessons`](session-lessons/SKILL.md) | Analyse multiple sessions for recurring friction and effective patterns that deserve durable codification. |
| [`skill-creator`](skill-creator/SKILL.md) | Create, improve, validate, and evaluate Agent Skills. |
| [`teach-me`](teach-me/SKILL.md) | Run measured tutoring, review, and learning-coach loops with durable receipts and transfer evidence. |

## Workflow-internal modules

| Module | Owning agent | Owned stage |
| --- | --- | --- |
| [`implement-ticket`](implement-ticket/SKILL.md) | `implement` | Implement or remediate one bounded ticket with observable RED/GREEN evidence. |
| [`explain-diff`](explain-diff/SKILL.md) | `pr-review` | Build a causal explainer for moderate or high comprehension risk. |
| [`human-verdict-gate`](human-verdict-gate/SKILL.md) | `pr-review` | Prepare a revision-specific decision packet with unanswered human fields. |
| [`record-verdict`](record-verdict/SKILL.md) | `pr-review` | Persist explicit human judgement and material-risk dispositions for one exact revision. |
| [`refine-ticket`](refine-ticket/SKILL.md) | `refine` | Assess and draft one bounded work item against the readiness contract. |
| [`split-work`](split-work/SKILL.md) | `refine` | Decompose a clear multi-ticket outcome into vertical slices and an acyclic dependency graph. |

## Responsibility boundaries

1. Evidence is not approval.
2. Explanation is not proof of correctness.
3. Technical severity is not policy disposition.
4. A policy threshold is not a human verdict.
5. Model-generated rationale or risk acceptance is not human judgement.
6. A review artefact or verdict applies only to the exact revision it names.
7. Green checks cannot silently replace explicit risk acceptance.
8. Automation may enforce a recorded verdict but must not invent one.
9. Agents coordinate capabilities; they do not erase responsibility boundaries.
10. Portability and correct skill-loading boundaries take priority over avoiding
    small amounts of duplicated guidance.
11. Review calibration may propose policy experiments but must not silently change
    thresholds, reviewer topology, required dimensions, or approval rules.

## Validation

The repository validates every top-level skill on pushes and pull requests using
the official `skills-ref` validator pinned to a reviewed upstream commit. It also
enforces the repository's 500-line active-instruction policy and runs bundled
script tests.

Local validation:

```bash
python -m pip install \
  "git+https://github.com/agentskills/agentskills.git@38a2ff82958afee88dadf4831509e6f7e9d8ef4e#subdirectory=skills-ref"
for skill_md in */SKILL.md; do
  skills-ref validate "$(dirname "$skill_md")"
done

python3 contributor-analysis/scripts/test-analyse-contributors.py
python3 git-archaeologist/scripts/test-analyse-history.py
node teach-me/scripts/learning-state.test.mjs
node teach-me/scripts/learning-engine.test.mjs
```

See [`docs/agent-skills-audit-2026-07-21.md`](docs/agent-skills-audit-2026-07-21.md)
for the repository-wide specification and best-practices audit.

## Installation

Copy each required public skill directory into the location used by the target
agent harness. Install canonical agent definitions from `agents/` separately and
adapt them to the harness's agent format.

When a harness supports generated adapters, translate namespaced metadata there;
do not fork the canonical `SKILL.md` merely to add non-standard top-level fields.