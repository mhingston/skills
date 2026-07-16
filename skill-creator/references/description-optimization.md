# Agent-Native Description Optimization

Read this file only when optimizing a skill's trigger description.

## 1. Create trigger cases

Create about 20 realistic queries split between `should_trigger: true` and `should_trigger: false`.

Positive cases should cover formal, casual, abbreviated, typo-prone, indirect, and uncommon phrasing. Include only requests that would materially benefit from the skill.

Negative cases should be difficult near-misses: adjacent workflows, shared keywords with different intent, direct tasks that do not need the skill, and sibling-skill conflicts. Do not use obviously unrelated negatives.

Record each query and label in Markdown, JSON, a spreadsheet, or another portable format the current environment can inspect. Review the cases with the user when rigorous optimization matters.

Split the cases into:

- a development set used to understand errors and draft revisions;
- a validation set not inspected while drafting the revision;
- an optional untouched final test set when unbiased reporting matters.

## 2. Measure native discovery

Use the same harness and model that will perform skill discovery.

For each query:

1. Start from a fresh context when the harness permits it.
2. Make the skill available normally; do not explicitly invoke or provide its path.
3. Observe whether the harness discovers or loads it.
4. Record the predicted decision, expected label, and evidence.

Test a candidate and baseline description under matched conditions. Repeat ambiguous cases when discovery is nondeterministic.

If the harness does not expose discovery events, ask the agent to classify whether the skill applies using only the available skill metadata. Clearly label this as a classification surrogate; it does not prove end-to-end discovery behavior.

## 3. Revise from development errors

Inspect false positives and false negatives on the development set.

- Add concrete trigger contexts that valid indirect requests share.
- Add boundaries that distinguish difficult near-misses.
- Remove vague or generic wording that competes with unrelated skills.
- Keep the description concise enough to scan alongside other skills.
- Avoid copying evaluation phrases or enumerating the development set.

Change one coherent aspect at a time so the result remains interpretable.

## 4. Select on held-out evidence

Evaluate the candidate description on the validation set before inspecting individual validation errors. Compare:

- accuracy;
- false-positive rate;
- false-negative rate;
- repeated-run consistency;
- clarity and specificity.

Apply the candidate only when it improves held-out behavior without broad keyword-driven activation. If several candidates were selected using the same validation set, treat that set as development data and use a fresh final test before making a strong claim.

Show the user the before and after descriptions, the cases evaluated, the harness and model, and the observed results.
