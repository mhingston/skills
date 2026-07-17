# Guided Learning Artifacts

Use a learning artifact only when interaction exposes the concept's structure or the learner explicitly requests one. A decorative animation or passive infographic can create familiarity without retrieval.

## Good candidates

- a parameter whose effect can be manipulated;
- a mechanism that unfolds over time;
- a structure that can be rearranged;
- a procedure whose ordering matters;
- a contrast where one changed dimension produces a meaningful difference;
- a recurring misconception that a concrete counterexample can expose.

Prefer a static diagram or table when manipulation adds no explanatory value. Prefer dialogue alone for purely verbal or derivational claims.

## Required learning cycle

Build the artifact around:

```text
predict -> manipulate or step -> explain -> retrieve -> reconstruct
```

Require all of the following:

1. **Prediction gate.** Ask the learner to commit before the central behavior is revealed.
2. **Guided model.** Expose only concept-relevant controls. For novices, demonstrate one worked interaction before free manipulation.
3. **Self-explanation.** After a meaningful action, ask why the observed result occurred before showing the explanation.
4. **Embedded retrieval.** Include at least two open-recall prompts after the relevant material.
5. **Coherence.** Remove decorative motion, duplicated labels, and unrelated examples. Do not place explanatory text over moving content.
6. **Reconstruction ending.** Ask the learner to hide the artifact and rebuild the mechanism or argument from a blank page.
7. **Accessibility and portability.** When producing HTML, prefer one offline file, keyboard-operable controls, reduced-motion support, and readable light and dark themes.

## Widget selection

Choose the smallest interaction that tests the likely wrong prediction:

- parameter slider;
- predict-then-reveal plot;
- drag-to-order causal chain;
- contrast toggle;
- worked-example stepper;
- small concept-map view.

## Evidence handling

The artifact is an encoding medium, not proof. Collect its retrieval answers in the normal dialogue, confidence, assessment, and receipt workflow. If a concept repeatedly lapses, regenerate the artifact around the current misconception instead of polishing the old presentation.

## Verified reference compression

A saved reference is a retrieval product, not a lesson generated in advance. Offer one only after the learner has successfully produced the underlying knowledge.

1. Ask the learner to compress the idea into the smallest useful form: a definition, contrast, algorithm, checklist, worked pattern, or glossary entry.
2. Let the learner draft it, or let them materially edit an agent draft. Do not label untouched agent prose as learner-authored.
3. Check it against the claim, rubric, and trusted source material. Repair errors with the learner before saving.
4. Link the saved reference to at least one recalled receipt. The receipt is the evidence; the reference adds no additional mastery credit.
5. Keep it optimized for later use rather than for teaching from scratch. Revise it when the learner's model deepens.

Use `reference add` from [state-and-receipts.md](state-and-receipts.md) to save Markdown content after this cycle. Prefer a glossary entry only after the learner can use the term correctly; choose one canonical term and note important aliases or ambiguities in the content.
