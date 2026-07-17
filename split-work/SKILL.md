---
name: split-work
description: >-
  Internal refine-agent module for decomposing a clear multi-ticket outcome into
  independently verifiable vertical slices with honest blocking edges. Use only
  when the refine agent supplies a settled destination, source snapshot,
  orchestration state, repository context, and resolved publication target with
  tracker capabilities.
user-invocable: false
---

# Split Work

Turn clear, bounded multi-ticket work into an approved candidate dependency
graph. Produce drafts only; the `refine` agent owns child refinement, human
approval, tracker mutation, and verification.

## Invocation contract

Run this module only when `refine` supplies all of:

- `refine_agent_state: DECOMPOSE`;
- the complete parent snapshot and source version;
- an agreed destination, scope, constraints, and non-goals;
- observed repository context;
- a resolved `PUBLICATION_TARGET` naming the tracker, connected interface,
  container, project or repository, parent, writable status, supported child
  types, required fields, and relationship capabilities.

If invoked directly or without this context, do not explore the repository,
propose tickets, or write to a tracker. Return
`REQUIRED_ORCHESTRATOR_CONTEXT` and direct the caller to the `refine` agent.

This module never creates, edits, links, labels, or closes tracker items.

If `refine` supplies otherwise complete orchestration context but the publication
target is missing or ambiguous, return `PUBLICATION_TARGET_REQUIRED`. Do not ask
the user or select a connector here; target resolution belongs to `refine`.

## Boundaries

- Do not split one coherent outcome merely because it touches several layers or
  files.
- Do not manufacture implementation tickets while the destination or material
  decisions remain unclear.
- Do not produce horizontal layer tickets by default, such as separate database,
  backend, frontend, and test tickets for one behaviour.
- Do not hide unresolved product or architecture decisions inside ticket text.
- Do not discover connectors, choose a publication target, or call Jira,
  Atlassian MCP, GitHub, Linear, or another tracker interface.
- Do not close or replace the parent item.
- Do not use file paths, line numbers, or speculative code snippets as durable
  scope boundaries. Stable interfaces and schemas are appropriate when already
  decided.

## 1. Check decomposition readiness

Confirm that:

- the destination describes what will be true when the initiative is complete;
- scope and non-goals distinguish this effort from adjacent work;
- shared constraints and consequential decisions are settled;
- the publication target exposes a usable child type, required-field contract,
  and parent or body-text fallback suitable for the proposed children;
- the current system and highest useful verification seams are understood well
  enough to identify end-to-end outcomes;
- remaining uncertainty can be contained inside individual tickets without
  changing the overall breakdown.

If any point fails, return `DISCOVERY_REQUIRED` with the highest-value unresolved
decision and one focused question for the orchestrator. Do not draft downstream
tickets from `Not yet specified` work.

## 2. Find vertical slices

Break the outcome into tracer-bullet slices. Each child must:

- deliver one narrow but complete behavioural, operational, or learning outcome;
- be demonstrable or verifiable independently after its declared blockers;
- fit a fresh agent context with room for investigation, implementation, tests,
  and recovery from ordinary surprises;
- contain its own acceptance boundary and explicit non-goals;
- preserve the parent destination and shared constraints;
- avoid depending on a future ticket for tests of behaviour it claims to deliver.

Prefer the smallest slice that creates real evidence or user/system value. Do not
equate a technical layer with a deliverable.

### Prefactoring

Create a prefactoring ticket only when it is independently safe and verifiable
and materially reduces risk for later slices. Name the capability or seam it
creates; do not use a generic `refactor first` ticket.

### Wide refactors

When one mechanical change has a blast radius that cannot land green as vertical
slices, use expand-migrate-contract:

1. **Expand** — introduce the new compatible form beside the old.
2. **Migrate** — move callers in independently green batches sized by blast
   radius.
3. **Contract** — remove the old form only after every migration completes.

Make the contract ticket depend on every migration. If migration batches cannot
remain green independently, state the integration-branch constraint and include
a final integrate-and-verify ticket.

## 3. Build honest blocking edges

For every proposed edge `A blocks B`, verify that B cannot be implemented or
verified safely before A completes. Remove preference-only sequencing.

Require:

- an acyclic graph;
- explicit blockers for every non-frontier child;
- maximum safe parallelism;
- no child that depends on an unspecified future outcome;
- dependency order suitable for creating real tracker links.

Identify the initial executable frontier: children with no incomplete blockers.

## 4. Draft parent and children

Return a proposed managed parent section:

```markdown
## Child work

- [Child title] — one-line outcome; blocked by ...
```

The parent section is an index, not a duplicate specification. It must be
replaceable idempotently between `## Child work` and the next level-two heading
or end of body.

For every child, draft:

```markdown
## Parent

## Outcome

## Why this slice exists

## Acceptance criteria

## Verification

## Blocked by

## Constraints

## Out of scope
```

Use `None — can start immediately` when there are no blockers. Preserve shared
constraints by stating only the subset material to that child; link to the
parent for full context when the tracker supports durable references.

Draft the selected target's issue type and required field values when they are
known. If a required value cannot be inferred from approved context, surface it
as one unresolved field for the orchestrator rather than inventing it.

These are candidate drafts, not yet agent-ready tickets. The orchestrator must
invoke `refine-ticket` for each child after the human accepts the proposed
granularity and graph.

## 5. Prepare the review packet

Return the breakdown in dependency order. For each child include:

- title;
- end-to-end outcome;
- complete draft body;
- blockers and downstream dependants;
- why it fits one fresh agent context;
- its independent verification signal.

Also include:

- resolved publication target, connected interface, intended child issue type,
  and required-field mapping;
- proposed parent managed section;
- initial executable frontier;
- assumptions and unresolved evidence;
- tracker-native relationship plan or body-text fallback;
- any wide-refactor exception and why vertical slicing was unsafe.

## Return packet

Return exactly one of:

- `BREAKDOWN_PROPOSED` — include the complete review packet and mark every child
  `NEEDS_CHILD_REFINEMENT`;
- `DISCOVERY_REQUIRED` — include one unresolved decision and focused question;
- `PUBLICATION_TARGET_REQUIRED` — identify the missing or ambiguous target field
  without offering or selecting a connector;
- `SINGLE_TICKET` — explain why the source is one coherent outcome;
- `BLOCKED` — include the missing evidence or capability and recovery action.

Before returning `BREAKDOWN_PROPOSED`, confirm the graph is acyclic, every edge
is necessary, every child has an independent verification signal, the parent
destination is completely covered, non-goals are not smuggled into children,
no ticket exists only to implement a horizontal layer, and every child can be
represented in the resolved target without an invented required field.
