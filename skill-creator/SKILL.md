---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit or optimize an existing skill, run paired evals, benchmark skill performance and variance, or optimize a skill description for accurate triggering.
---

# Skill Creator

Create focused, reusable procedural packages and improve them through paired evaluation. Optimize for measurable task lift, not documentation completeness.

## Core workflow

1. Capture the repeated task, trigger conditions, inputs, outputs, and success criteria.
2. Identify the procedural gap the skill must close.
3. Choose the lightest reliable mix of instructions, scripts, references, and assets.
4. Write or revise the skill with explicit applicability boundaries and validation checks.
5. Compare it against no skill or the previous version on realistic tasks.
6. Remove guidance that adds overhead, encode repeated deterministic work in scripts, and retest.
7. Optimize the description and package the skill when useful.

Adapt the sequence to the user's request. Do not force a full evaluation cycle when the user wants a quick, judgment-based revision.

## Design principles

### Solve a class of tasks, not one instance

Create a skill only when the workflow or expertise is likely to recur. If the current request is a one-off task, complete and verify it first; extract a skill afterward only when the reusable procedure is clear.

Do not turn task-specific filenames, expected outputs, constants, or hidden verifier details into general instructions. Treat examples as evidence about the workflow, not as an answer key.

### Curate before codifying

Ground non-obvious domain claims in canonical documentation, expert input, or verified artifacts. Separate confirmed facts from assumptions. Never freeze an unverified assumption into instructions or a script merely because it worked on one example.

### Keep the active instructions focused

Include procedural details the agent cannot reliably infer: exact constraints, domain quirks, invariants, checks, and failure recovery. Remove broad explanations, generic advice, and repeated material.

Prefer one focused skill over several overlapping skills. Keep `SKILL.md` materially below 500 lines when possible and move optional or variant-specific detail into directly linked reference files.

### Match freedom to the task

- Use text instructions when judgment and context determine the approach.
- Use parameterized scripts when a preferred pattern recurs but inputs vary.
- Use tightly constrained scripts when consistency, format correctness, or operation order is critical.

Do not mandate a sophisticated tool or framework merely because it is theoretically ideal. A skill should improve the agent's native strategy, not suppress a simpler valid one.

## 1. Capture intent

Extract answers from the conversation and existing artifacts before asking the user:

1. What recurring task should the skill enable?
2. What prompts or contexts should and should not trigger it?
3. What inputs, outputs, and exact format constraints apply?
4. Which steps require judgment, and which are mechanical?
5. What canonical sources, domain quirks, and invariants matter?
6. What does success look like, and can it be checked deterministically?
7. Which edge cases, dependencies, cost limits, or safety boundaries apply?

Ask only for gaps that materially change the design. Confirm the scope before implementing when the answer is ambiguous.

## 2. Plan reusable contents

Choose each artifact by function:

| Need | Put it in |
|---|---|
| Core workflow, selection rules, applicability boundaries | `SKILL.md` |
| Stable domain knowledge, schemas, detailed variants | `references/` |
| Repeated deterministic transformation or validation | `scripts/` |
| Templates, fonts, icons, boilerplate used in outputs | `assets/` |

### Prefer a script for repeatable deterministic work

If the same workflow can be specified as inputs, deterministic steps, and verifiable outputs, implement it once as a script instead of asking every future agent to reconstruct it. Transcript evidence that multiple runs independently write similar helper code or repeat the same mechanical sequence is a strong signal to bundle a script.

Keep the work in instructions when it depends primarily on open-ended judgment. Do not wrap a single trivial command unless the wrapper adds meaningful defaults, validation, portability, or error recovery.

For every bundled script:

- Define explicit inputs, outputs, exit behavior, and supported environments.
- Parameterize instance data; never hard-code task-specific paths, units, constants, or expected answers.
- Use calibrated, conservative defaults and expose consequential assumptions as options.
- Make execution deterministic and idempotent where practical; seed randomness and provide a dry run for destructive operations.
- Validate preconditions, output formats, and algorithmic invariants; fail with actionable errors.
- Provide a lightweight path and a fallback when the full workflow or dependency is unnecessary or unavailable.
- Run the script on representative inputs and at least one important edge case.
- Tell the agent when and how to invoke it from `SKILL.md`; do not duplicate its implementation in prose.

Do not assume a particular scripting language or runtime is installed. Prefer tools already available in the target environment, declare runtime requirements, and preserve an agent-executable fallback when practical. A script belongs in the skill only when its portability and deterministic benefit outweigh the added dependency.

### Define an applicability and complexity contract

For each non-trivial recipe, make these points discoverable:

- **Use when**: evidence that justifies the workflow.
- **Avoid when**: cases where direct execution or another tool is better.
- **Fast path**: the cheapest reliable route for routine cases.
- **Full path**: optional heavier processing and why it is warranted.
- **Fallback**: how to recover when a tool, solver, or assumption fails.
- **Checks**: format constraints, sanity bounds, and invariants that prove the result is plausible.

## 3. Write the skill

### Required structure

```text
skill-name/
├── SKILL.md
│   ├── YAML frontmatter: name and description
│   └── Focused Markdown instructions
├── scripts/       # only when needed
├── references/    # only when needed
└── assets/        # only when needed
```

Use lowercase letters, digits, and hyphens for the skill name. Preserve an existing skill's name when updating it.

### Frontmatter

Include only `name` and `description` unless the target runtime explicitly requires another field.

Make the description precise and discriminative: state what the skill does, concrete situations that should trigger it, and boundaries needed to avoid near-miss activation. Cover natural paraphrases without generic keyword stuffing. Discovery depends on the description, but discovery alone does not make a skill effective.

### Body

- Write instructions in imperative form.
- Lead with the shortest useful workflow and route optional detail to references.
- Name canonical data sources and parsing quirks when they affect correctness.
- State exact file-format or interface constraints that downstream systems inspect.
- Surface algorithmic invariants, plausibility checks, and recovery steps.
- Mark optional steps and explain when the heavier route earns its cost.
- Use concise, realistic examples only when they clarify a decision or format.
- Explain why a constraint matters when that helps the agent generalize.

Avoid deeply nested references. Link every reference directly from `SKILL.md` and say when to read it. For a reference longer than 100 lines, add a table of contents.

## 4. Evaluate the skill

Evaluate task completion, not whether the agent merely read or mentioned the skill. High invocation does not guarantee a better result.

Use matched, paired conditions:

- For a new skill, compare the skill against no skill.
- For a revision, compare it against a snapshot of the prior version.
- Keep the prompt, files, model, harness, environment, and verifier the same within each pair.
- Use deterministic checks where possible and human review for genuinely subjective quality.
- Repeat matched runs when nondeterminism or consequences justify it; report variance rather than trusting a single run.
- Test the actual deployment harnesses when the skill must work across more than one; do not assume results transfer between harnesses.

Start with 2–3 realistic prompts, including a routine case, a boundary or fallback case, and an important failure-prone case. Expand only after the skill shows useful lift.

Read [references/evaluation.md](references/evaluation.md) before setting up, running, grading, or reviewing evals.

## 5. Improve from evidence

Inspect trajectories and artifacts, not only final scores. Ask:

- Did the skill add useful verifier-facing detail or just more context?
- Did a heavyweight pipeline crowd out a simpler valid path?
- Did generic guidance displace a stronger native strategy?
- Did a mandated solver or schema create a debugging dead end?
- Did multiple runs recreate the same deterministic helper that should become a script?
- Did a script encode an unchecked assumption or accept implausible output?
- Which instructions were ignored, ambiguous, or unnecessary?

Generalize from failures instead of overfitting to individual prompts. Remove instructions that do not earn their token and execution cost. Add applicability boundaries, fast paths, fallbacks, checks, or scripts only where the evidence supports them.

Iterate until the user is satisfied, the feedback is clean, or further changes no longer produce meaningful improvement.

## 6. Optimize triggering when needed

Treat description optimization as a separate classification problem with realistic positive prompts and difficult near-misses. Optimize on held-out queries and apply the result only when it improves triggering without broad over-activation.

Read [references/description-optimization.md](references/description-optimization.md) before optimizing a description.

## 7. Validate and package

Validate the finished skill with the agent and the tools available in the environment:

- confirm the folder name and frontmatter name match;
- confirm the frontmatter contains a precise name and description;
- follow every relative link and remove orphaned resources;
- inspect commands and examples for undeclared runtime or harness assumptions;
- run every new or modified bundled script on representative input and an important edge case;
- perform a final matched eval when the change could affect behavior.

Package only when the user or target environment requires an archive. Use an available deterministic archiving tool, preserve the skill directory as the archive root, and inspect the archive contents before presenting it.

## Resources

- [references/evaluation.md](references/evaluation.md): agent-native paired execution, grading, comparison, and iteration
- [references/description-optimization.md](references/description-optimization.md): agent-native trigger-query evaluation and description revision
