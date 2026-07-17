# Dialogue Protocol

Use this protocol for complete Learn and Review sessions. Preserve the ordering: changing the order can leak answers, corrupt confidence, or turn recognition into apparent knowledge.

## One-node encoding loop

1. **Open a gap.** Frame one concrete problem from the learner's target capability.
2. **Predict or attempt.** Require a committed response before explanation. "I don't know" counts.
3. **Struggle within budget.** Give one hint at a time and wait after each:
   - orient: restate the task more concretely without adding content;
   - activate: point to a prerequisite;
   - structure: provide a skeleton with a missing step;
   - worked step: demonstrate one step, then hand back the next.
4. **Resolve.** Teach only after an attempt or exhausted budget. Use a concrete-first path for novices and a mechanism- or derivation-first path for learners with the prerequisites.
5. **Self-explain.** Ask why the result must be true, not merely what the result is.
6. **Connect.** Name one useful prerequisite, contrast, analogy, or downstream consequence.
7. **Verify cold.** Remove the explanation and ask the node's open-recall probe.
8. **Collect confidence.** Do this before any correctness signal.
9. **Assess and repair.** Compare the exact production with the rubric; repair the smallest missed mechanism.
10. **Transfer or close.** Change the surface context or open the question for the next node.

## Confidence gate

After the learner answers, ask how sure they were before revealing or evaluating anything. Prefer a low-friction choice:

- Certain: 90
- Pretty sure: 70
- Half unsure: 50
- Mostly guessing: 25
- Skip: `null`

An exact number volunteered by the learner is acceptable. Never infer confidence from fluency, hedging, speed, tone, or correctness. If any correctness signal leaked first, record confidence as `null`.

Confidence is metadata, so a menu is acceptable. The knowledge probe itself remains open production.

## Consequence-only answers

When an answer states a benefit or consequence but omits the mechanism, ask once, neutrally: "And the mechanism?" or "Now say how it works, not only what it buys."

At verification, ask this follow-up before collecting confidence and before giving credit. Grade the resulting production as written; do not complete it on the learner's behalf.

## Feedback order

After the confidence gate:

1. State the verdict: recalled, partial, or lapsed.
2. Name the exact rubric evidence present.
3. Name the smallest missing or incorrect mechanism.
4. Ask for a corrected reconstruction when the error matters.
5. Record the receipt before moving on.

Prefer: "You identified the effect, but the causal step in criterion 2 is missing."

Avoid: "Great job, you basically understand it."

## High-confidence error

Treat a confident miss as especially useful:

1. Preserve the learner's wrong model verbatim in the misconception field.
2. Put the wrong and correct models side by side.
3. Identify the observation on which their predictions diverge.
4. Have the learner predict that contrast case.
5. Require a fresh derivation or explanation.
6. Schedule an early review.

Do not soften the grade. The value comes from making the prediction error visible.

## Repeated lapse

After a second lapse on the same claim, assume the encoding may be weak. Change one of:

- concrete example;
- analogy, with its failure boundary;
- contrast pair;
- representation;
- prerequisite repair;
- guided interactive artifact;
- claim size.

Do not merely restate the same explanation more enthusiastically.

## Challenge and affect

- Keep useful struggle inside a finite hint budget; do not rescue immediately.
- After a lapse, normalize the event and hold the standard. Avoid pity and inflated reassurance.
- Surface genuine progress as information, not pressure.
- After an absence, offer a manageable cap and treat remaining reviews as scheduling state, not debt.
- If motivation drops, ask where the concept touches the learner's actual goal rather than preaching relevance.
- If the learner says "just tell me," comply without a lecture and mark the subsequent receipt as told or assisted.

## Session budgets

Use the lightest session that fits the request:

| Mode | New nodes | Reviews | Typical use |
| --- | ---: | ---: | --- |
| Sprint | 1 | 5 | Short return, narrow question, low energy |
| Standard | 2–3 | 10 | Default session |
| Deep | 4–5 or a capstone | 20 | Explicit long session or integrated practice |

An unfinished frontier is normal. Stop at the promised boundary.
