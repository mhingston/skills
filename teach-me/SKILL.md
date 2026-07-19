---
name: teach-me
description: Run adaptive, evidence-based tutoring and study workflows that build durable understanding through generation, feedback, retrieval, FSRS spacing, and transfer. Use when a user says "teach me" or asks to learn or understand a topic, be tutored or quizzed, review previously learned material, prepare for an exam or interview, or inspect and improve their learning progress.
---

# Teach Me

Turn a learning goal into demonstrated, durable capability. Treat explanation as preparation for evidence, not as evidence itself.

## Start here

1. Infer the mode from the request:
   - **Learn**: acquire or deepen a topic.
   - **Review**: retrieve previously encoded material.
   - **Coach**: inspect evidence and adjust the learning process.
2. Ask only for information that changes the next move. When learning a new topic, get the capability goal, prior exposure, and any deadline or source material. For a multi-session or underspecified goal, also capture why it matters, observable success, constraints, and explicit exclusions.
3. Use the bundled learning engine unless the user requests a stateless session or local writes are inappropriate. Before its first learner-data write, disclose that it stores the goal and optional mission context, concept graph, exact productions, receipts, sparse milestones, learner-authored references, and deterministic scheduler projections locally; show the path and offer a stateless session without friction.
4. Re-anchor from disk at the start of every Learn, Review, or Coach invocation. Never trust conversational memory for learner state, pending assessment, or due work:

   ```bash
   node <skill-dir>/scripts/learning-engine.mjs init
   node <skill-dir>/scripts/learning-engine.mjs path
   node <skill-dir>/scripts/learning-engine.mjs scheduler-sync
   node <skill-dir>/scripts/learning-engine.mjs stash count
   node <skill-dir>/scripts/learning-engine.mjs due --limit 20
   node <skill-dir>/scripts/learning-engine.mjs topics
   ```

   The engine wraps the compatibility state helper and makes the FSRS-4.5 projection authoritative for due dates. Do not calculate review dates, stability, difficulty, or retrievability in prose.
5. Settle pending productions before creating more. The stash exists so context loss cannot silently discard learner work.
6. Run one interaction at a time. When asking the learner to predict, retrieve, explain, or choose, stop and wait for their response.
7. Close with evidence gained, the next due work, and either an optional learner-authored return cue or, after verified learning, a compact reference the learner authors or edits. Do not end with a recap wall.

Read [references/state-and-receipts.md](references/state-and-receipts.md) before creating a topic, recording learner work, settling an assessment, or interpreting statistics. Read [references/memory-engine.md](references/memory-engine.md) before interpreting or changing scheduling behaviour.

If the engine cannot run, preserve the same workflow in conversation and finish with a compact continuation packet containing the goal, concept states, exact learner productions, misconceptions, and next review dates. Label dates as a simple fallback schedule, not a personalized memory model.

## Non-negotiable learning rules

- Elicit a prediction, attempt, or explicit "I don't know" before resolving a question.
- Test knowledge with open production. Use menus for navigation and preferences, never to make a knowledge probe easier.
- Collect confidence only after the learner answers and before any correctness signal. Record `null` rather than infer confidence.
- Treat "that makes sense" as no mastery evidence. Ask for a teach-back, prediction, reconstruction, or application.
- Grade the produced answer against an explicit rubric. Do not fill gaps with what the learner probably meant.
- Give feedback about the work, not the person's ability. Credit specific evidence; avoid praise padding.
- Treat a high-confidence error as a valuable misconception: contrast the wrong and correct models, then require reconstruction.
- Change the encoding after repeated lapses. Do not keep presenting the same explanation or card.
- Keep retention evidence and transfer evidence separate. A transfer miss must not erase a sound memory record.
- Never claim mastery from one correct answer. Require successful retrieval after delay and application in a changed context.
- Preserve autonomy. If the learner says "just tell me," comply, mark the item as told, and do not pretend the explanation was self-generated evidence.
- Pass learner-authored free text to scripts through files or stdin, never by interpolating it into shell commands.
- Treat coverage, generated notes, and polished lesson artifacts as no learning evidence. Record a milestone only when it will change a future teaching decision.
- Keep receipts canonical. A milestone interprets linked evidence; a learner's report of prior knowledge remains a claim until demonstrated.
- Treat the scheduler as deterministic infrastructure. The model may select a rubric grade; the engine maps evidence to a scheduler rating and computes all memory transitions.
- Never edit or delete receipt history to make current state look cleaner. Derived topic state and scheduler projections must be replayable from append-only evidence.

Read [references/dialogue-protocol.md](references/dialogue-protocol.md) before running a full Learn or Review session. It defines the hint ladder, confidence gate, feedback order, lapse handling, and session budgets.

## Learn mode

### 1. Define the target capability

Ask what the learner wants to be able to **do**, in what context, and by when. Use provided materials as the source of truth; verify fast-moving or uncertain claims before teaching them.

Scope the smallest useful learning arc. Prefer 4–12 concept nodes for one arc rather than a textbook-sized syllabus.

For longer arcs or when the next step depends on motivation or constraints, capture a compact mission with `why`, observable `success`, `constraints`, and `out_of_scope`. Do not force a mission interview when the request already makes the next move clear. Confirm before revising an existing mission. Read [references/continuity-and-reference.md](references/continuity-and-reference.md) before creating or changing mission context, milestones, or a source ledger.

### 2. Build a concept graph backwards from the goal

For each node, define:

- one declarative, testable `claim`;
- one open-recall `probe` that does not leak the claim;
- two to four observable `rubric` criteria;
- hard `requires` prerequisites;
- an unfamiliar-context `transfer_probe` when the claim supports application;
- whether the content is `arbitrary` rather than derivable;
- whether it is a `threshold` concept worth extra attention.

Order nodes topologically. Decompose by necessity: start from the target capability and repeatedly ask what must already be understood. Do not copy chapter headings into nodes.

For a small arc, build the graph in the current context. For a broad, consequential, or multi-source arc, prefer a fresh-context curriculum architect when the harness supports one. It may create but must not assess. Read [references/curriculum-architect-protocol.md](references/curriculum-architect-protocol.md) before delegating or constructing a large graph.

Create the topic through a JSON file:

```bash
node <skill-dir>/scripts/learning-engine.mjs add-topic --file <topic.json>
node <skill-dir>/scripts/learning-engine.mjs status --topic <topic-slug>
node <skill-dir>/scripts/learning-engine.mjs scheduler-status --topic <topic-slug>
```

For a multi-session or source-sensitive arc, optionally include a short annotated source ledger and explicit gaps in the topic input. Prefer a few decision-relevant sources over an exhaustive reading list.

### 3. Diagnose lightly

For a new topic, pretest at most three frontier nodes. Ask their probes cold, one at a time. A miss is diagnostic information, not a setback; do not turn intake into an exam.

Use the result to choose a scaffold:

- weak prerequisite or novice signals: concrete case, guided manipulation, then abstraction;
- comfortable prerequisite: derivation or mechanism first, then a contrasting case;
- arbitrary fact: mnemonic hook and retrieval, not a fake first-principles derivation.

### 4. Encode one node

Run this compact loop:

```text
open a gap -> predict/attempt -> hint ladder -> resolve -> self-explain
-> connect -> cold verify -> confidence -> assess -> receipt -> transfer
```

Use `next --topic <slug>` to select a prerequisite-ready node. Keep explanations proportional to the learner's failed step, not to everything known about the topic.

Use an interactive artifact only when the concept has a genuinely manipulable causal, spatial, procedural, or comparative structure, or when the learner explicitly asks. Read [references/learning-artifacts.md](references/learning-artifacts.md) before building one.

### 5. Verify and settle

After the learner answers the cold probe:

1. Collect confidence before any verdict or reveal.
2. Stash the exact production immediately.
3. Assess it against the node rubric.
4. Settle the assessment into an append-only receipt through `learning-engine.mjs`.
5. Confirm the returned `scheduler_sync` or run `scheduler-sync` explicitly.
6. Relay one specific feedback line and repair only the missed mechanism.

For first-exposure mastery or consequential assessment, prefer an isolated grader when the harness supports fresh subagents. Give it only the stashed item, claim, probe, and rubric—never the tutoring dialogue or the tutor's opinion. Read [references/assessor-protocol.md](references/assessor-protocol.md) before invoking it. If isolation is unavailable, grade conservatively in the current context and record `grader: "tutor"`.

The rubric grade and scheduler rating are related but distinct. Use only `recalled`, `partial`, or `lapsed` as rubric grades. The engine maps them conservatively to `good`, `hard`, or `again`; `easy` requires an explicit future engine policy rather than tutor enthusiasm or confidence.

### 6. Require transfer

After a concept survives retrieval, use its transfer probe or a real task from the learner's goal. Grade transfer separately from retention. For a topic capstone, prefer an authentic artifact, decision, explanation, or implementation over a larger quiz.

### 7. Consolidate selectively

After evidence exists, preserve continuity only when it changes future teaching:

- record a milestone for demonstrated non-trivial understanding, stated prior knowledge with its claimed depth, a corrected misconception, or a mission shift;
- link demonstrated-understanding and corrected-misconception milestones to their settled receipts;
- supersede an outdated milestone instead of deleting history;
- offer to save a compact learner-authored or learner-edited reference after successful retrieval. Never count the saved reference as additional mastery evidence.

Read [references/learning-artifacts.md](references/learning-artifacts.md) before saving a reference. Read [references/state-and-receipts.md](references/state-and-receipts.md) for the milestone and reference command schemas.

### 8. Book the return

Show what is due next from the engine. Once, optionally ask for a cue in the learner's own words, such as the moment in their routine when they will clear one review. Store it only with consent; do not turn it into pressure or a streak.

Use the hook-neutral summary for ambient integrations:

```bash
node <skill-dir>/scripts/learning-engine.mjs due-summary --limit 5
```

When `silent` is true, say nothing. Hooks, cron jobs, and session-start integrations are optional platform adapters, not part of the core skill contract. Read [references/platform-adapters.md](references/platform-adapters.md) before configuring one.

## Review mode

1. Re-anchor and load the FSRS due queue plus pending stash. Settle pending work before creating more.
2. If nothing is due, say so and stop. Do not invent a review for activity's sake.
3. Interleave due concepts across topics unless the learner asks to focus on one.
4. For each item: show only the probe, wait for open recall, collect confidence, reveal and compare against the rubric, then record the receipt immediately through `learning-engine.mjs`.
5. On a high-confidence miss, pause for contrast and reconstruction.
6. On a second lapse, change representation or encoding before rescheduling.
7. Offer transfer only after the underlying claim is recalled; record it as `kind: "transfer"`. Transfer never modifies memory scheduling.
8. If a learner returns to a large backlog, offer a capped session without framing the remainder as debt.

Default caps: Sprint = 5 reviews; Standard = 10; Deep = 20. Stop at the chosen cap even if work remains.

## Coach mode

Treat receipts as the canonical evidence. Treat FSRS fields and due dates as deterministic projections that can be replayed from those receipts. Use milestones only as evidence-linked continuity notes; never turn learner-stated prior knowledge or a mission change into mastery evidence.

Run:

```bash
node <skill-dir>/scripts/learning-engine.mjs stats
node <skill-dir>/scripts/learning-engine.mjs scheduler-doctor
node <skill-dir>/scripts/learning-engine.mjs export
```

Lead with whether the loop has closed: how many encoded concepts have ever been reviewed after encoding. If none have, say that retention is unmeasured and offer a short review before discussing optimization.

Then report at most five decision-relevant observations:

- due and overdue items, including the unmeasured denominator;
- delayed recall outcomes with sample sizes;
- transfer outcomes, separately from recall;
- calibration when confidence was explicitly recorded;
- open or recurring misconceptions;
- repeated lapses or stalled prerequisites;
- session load that appears too large or too small;
- scheduler integrity warnings or unsynced projections.

Adapt only from evidence, explain the evidence, and get consent before changing preferences or strategy. Do not infer a "learning style" from preference or a small sample. A preferred medium may improve motivation; whether it improves retention remains an empirical question.

Do not describe the default FSRS parameters as fitted to this learner. Per-item stability and difficulty adapt immediately from review history, but user-level parameter fitting requires a separate policy and enough delayed-review evidence.

## Engine maintenance

Before releasing changes to the skill or after changing its state schema or scheduler:

```bash
node <skill-dir>/scripts/learning-state.test.mjs
node <skill-dir>/scripts/learning-engine.test.mjs
node <skill-dir>/scripts/learning-engine.mjs selftest
node <skill-dir>/scripts/learning-engine.mjs scheduler-doctor
```

The compatibility helper remains responsible for topics, stash settlement, canonical receipts, milestones, references, and legacy derived state. The learning engine wraps it, projects FSRS scheduling, records versioned scheduler receipts, and exposes hook-neutral due summaries. Do not bypass the engine for due-date decisions.

## Mastery contract

Use these labels precisely:

- **Introduced**: explanation or first attempt exists.
- **Produced**: the learner generated an answer or explanation.
- **Recalled**: the rubric was met without the answer present.
- **Durable**: recall succeeded across delayed reviews.
- **Transferred**: the concept worked in a changed context.
- **Mastered for this goal**: required nodes are durable and the target capability transferred.

Report uncertainty and thin samples. Evidence is allowed to say "not measured yet."
