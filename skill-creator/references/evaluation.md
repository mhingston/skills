# Agent-Native Evaluation

Read this file when setting up, running, grading, or reviewing a skill evaluation.

## Contents

1. [Principles](#principles)
2. [Define realistic cases](#1-define-realistic-cases)
3. [Prepare matched conditions](#2-prepare-matched-conditions)
4. [Execute with the agent](#3-execute-with-the-agent)
5. [Separate routing from outcome quality](#4-separate-routing-from-outcome-quality)
6. [Grade from evidence](#5-grade-from-evidence)
7. [Compare and report](#6-compare-and-report)
8. [Iterate without overfitting](#7-iterate-without-overfitting)
9. [Environment limitations](#environment-limitations)

## Principles

- Evaluate task outcomes, not whether the agent mentioned or loaded the skill.
- Run matched pairs: change the skill condition and hold everything else constant.
- Use the current agent harness directly. Do not require an eval framework, provider adapter, CLI, or language runtime.
- Isolate each run from prior context, files, caches, and other skill variants.
- Prefer deterministic checks for objective properties and human judgment for genuinely subjective quality.
- Record the harness and model. Do not assume results transfer to another harness.
- Preserve prompts, inputs, outputs, checks, and results so another agent can reproduce the comparison.

## 1. Define realistic cases

Start with two or three cases:

- a routine case;
- a boundary, fallback, or dependency-failure case;
- a format, invariant, or domain-quirk case likely to expose mistakes.

For each case, record:

- a short name;
- the exact user prompt;
- input files or setup;
- expected outcome;
- objective checks;
- subjective qualities requiring review.

Keep a small validation set for iteration. Reserve a final test set that is not consulted while revising the skill when an unbiased final measurement matters.

## 2. Prepare matched conditions

For a new skill, compare `with_skill` against `without_skill`. For a revision, snapshot the prior version and compare `candidate` against `baseline`.

Use a simple workspace when artifacts need to persist:

```text
<workspace>/
  iteration-1/
    <case-name>/
      trial-1/
        candidate/
          outputs/
          run.md
          result.json
        baseline/
          outputs/
          run.md
          result.json
```

The directory layout is a convention, not a required interface. For small evals, an inline table plus linked output artifacts is sufficient.

Record enough metadata to reproduce every run:

```json
{
  "case": "descriptive-name",
  "trial": 1,
  "condition": "candidate",
  "harness": "name and version if known",
  "model": "model identifier if known",
  "skill_version": "path, commit, hash, or stable label",
  "prompt": "exact user task",
  "inputs": ["relative/or/absolute/path"],
  "permissions": "relevant execution constraints",
  "duration_ms": null,
  "tokens": null
}
```

Use `null` when the harness does not expose a metric. Do not fabricate precision.

## 3. Execute with the agent

Run both sides with the same prompt, files, model, harness, permissions, tool access, resource limits, and external conditions.

For each condition:

1. Start from a fresh context and isolated workspace.
2. Expose only the intended skill version. Do not leave candidate and baseline copies discoverable together.
3. Give the task, inputs, output destination, and required deliverables.
4. Do not reveal expected answers, the intended improvement, or the other condition's result.
5. Save the final outputs and a concise execution record, including errors, fallbacks, and uncertainties.

When independent agents or fresh tasks are available and authorized, use them for cleaner isolation. Otherwise run sequentially in the current task and disclose that the author also executed the eval.

Repeat the complete matched pair at least three times when model variance or the consequences justify it. Pair trials by case and execution conditions; never pool unmatched runs.

## 4. Separate routing from outcome quality

Outcome evaluation may explicitly provide the skill path so the test measures whether the skill improves the work.

Routing evaluation asks whether the deployment harness discovers the skill from its metadata. Test it separately with:

- clear positive prompts;
- indirect or uncommon valid prompts;
- difficult near-misses;
- sibling-skill conflicts when relevant.

Routing is inherently harness-specific. Record how discovery was observed. If the harness cannot expose actual discovery behavior, label a direct classification exercise as a surrogate rather than presenting it as an end-to-end routing test.

## 5. Grade from evidence

Apply the same checks to both conditions.

Prefer deterministic evidence:

- required files and fields exist;
- output parses in the target consumer;
- exact format constraints hold;
- tests, validators, or build checks pass;
- algorithmic invariants and plausibility bounds hold;
- unsafe or unsupported inputs fail clearly;
- the documented fallback works.

If an objective check will recur, encode it as a deterministic verifier using a runtime already justified for the evaluated skill. Define its inputs, outputs, exit behavior, and dependencies. Do not introduce a runtime solely to support the eval.

For each check, record `passed`, `failed`, or `not_verifiable` with specific evidence. Treat `not_verifiable` as a gap, not a pass.

Use human review for qualities such as clarity, usefulness, aesthetics, or tone. For a blind comparison, label outputs A and B and hide their condition until after the judgment.

## 6. Compare and report

The agent should calculate and report:

- passed checks over total verifiable checks for each condition;
- paired wins, losses, and ties;
- absolute pass-rate delta;
- variation across repeated trials;
- wall-clock and token tradeoffs when available;
- non-discriminating or unverifiable checks;
- failures caused by overhead, bad applicability boundaries, brittle procedures, or unchecked assumptions;
- differences by harness or model.

For a few runs, show the arithmetic directly. Use an available deterministic calculator or spreadsheet for larger result sets, but keep the source results portable and readable.

Do not claim improvement from a high standalone score. Require paired evidence, meaningful output review, or both.

## 7. Iterate without overfitting

Inspect trajectories and outputs, identify the smallest generalizable change, and rerun the full validation set. Do not add task-specific answers or verifier details to the skill.

Stop when:

- the candidate shows meaningful lift without unacceptable cost;
- the candidate regresses and the evidence does not support another general change;
- user feedback is satisfied;
- further iterations no longer produce meaningful improvement.

Run the untouched final test set once after selecting the candidate when unbiased reporting matters.

## Environment limitations

- If baseline isolation is impossible, prioritize deterministic artifact checks and human review over a misleading numeric comparison.
- If only one harness is available, scope conclusions to that harness.
- If metrics are unavailable, omit them.
- If no browser or display is available, present results as Markdown and link directly to artifacts.
- If the installed skill is read-only, copy the baseline to a writable temporary workspace and preserve its original name.
