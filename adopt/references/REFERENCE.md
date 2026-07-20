# Reference Guide

Use this file when a deeper transfer analysis is needed across a repository,
product, service, customer journey, team workflow, or organisational context.

## Evaluation rubric

Score each candidate idea on a 1-5 scale.

### 1. Outcome impact

- 1 = barely noticeable or limited to an edge case
- 3 = meaningful improvement to a secondary outcome
- 5 = major improvement to a core user, customer, developer, team, or
  organisational outcome

### 2. Ease of adoption

- 1 = major rewrite, reorganisation, or capability build
- 3 = moderate change touching several systems, teams, or workflow stages
- 5 = small additive change using existing capabilities and ownership

### 3. Contextual fit

- 1 = conflicts with current architecture, incentives, constraints, or culture
- 3 = possible but requires material adaptation
- 5 = natural extension of current patterns and priorities

### 4. Maintenance and operational burden

- 1 = high ongoing support, governance, coordination, or operational cost
- 3 = manageable with explicit ownership
- 5 = low continuing cost once adopted

### 5. Strategic alignment

- 1 = off-strategy or distracts from current priorities
- 3 = adjacent to current goals
- 5 = directly reinforces an agreed outcome or roadmap

### 6. Evidence strength

- 1 = speculative claim or weak analogy
- 3 = plausible mechanism with partial evidence
- 5 = strong primary evidence and a close target analogue

### 7. Reversibility

- 1 = difficult or costly to unwind
- 3 = reversible with planned migration or process change
- 5 = cheap experiment or isolated change with a clear rollback path

## Simple prioritisation formula

```text
priority score =
  (impact * 0.30) +
  (ease * 0.20) +
  (fit * 0.20) +
  (strategic alignment * 0.15) +
  (evidence strength * 0.10) +
  (maintenance burden * 0.05)
```

Use the formula as a guide, not a substitute for judgement. Keep reversibility
visible as a separate decision factor: a lower-confidence idea may still be a
good experiment when it is cheap to reverse.

## Mechanism extraction template

For each relevant element of the source, record:

| Field | Question |
| --- | --- |
| Surface form | What is visibly implemented, described, or practised? |
| Intended outcome | What result is it meant to produce? |
| Mechanism | Why should it produce that result? |
| Enabling conditions | What capabilities, incentives, data, skills, or governance must exist? |
| Evidence | What directly supports the claimed outcome? |
| Costs | What implementation, behavioural, operational, or coordination cost is involved? |
| Failure modes | How could it degrade, be gamed, or create unintended effects? |
| Transfer hypothesis | Which part could plausibly work in the target context? |

## Target-anchoring prompts

### Common prompts

1. What exact target outcome would this improve?
2. Where does the relevant friction occur today?
3. Which existing capability, workflow, or ownership boundary can be reused?
4. Which source assumptions do not hold in the target?
5. What is the smallest reversible test?
6. What leading and lagging signals would show whether it worked?
7. Who owns adoption, operation, and reversal?
8. What new complexity or risk would become permanent?
9. What can be postponed until the hypothesis is validated?

### Repository or software target

1. Where in the codebase would this live?
2. Which existing modules or services can be reused?
3. What is the smallest safe implementation slice?
4. What migrations, configuration, permissions, or data changes are needed?
5. What tests and observability should be added?
6. What can be feature-flagged?
7. What architectural boundary could the idea accidentally erode?

### Product, service, or customer-journey target

1. Which journey stage or customer segment is affected?
2. Does the change reduce waiting, repetition, uncertainty, failure, or hand-off
   friction?
3. What happens when the new path fails?
4. Which assisted-service or operational teams absorb the consequences?
5. What customer behaviour would indicate real value rather than novelty?
6. Could the change optimise one channel while worsening the end-to-end journey?

### Team workflow or organisational target

1. Which decision right, feedback loop, or coordination cost is changing?
2. Do current incentives reinforce or undermine the proposed practice?
3. Is the source outcome dependent on leadership behaviour, staffing, culture, or
   organisational scale?
4. What new ritual, tool, role, or governance burden is introduced?
5. Can the practice be tested with one team or bounded workflow first?
6. How will local optimisation or gaming be detected?
7. What behaviour should stop if the new practice is adopted?

## Useful source signals

### Software and architecture signals

- clear module boundaries;
- simple extension points;
- testable seams;
- resilient state handling;
- safe defaults;
- easy local development;
- observability and validation hooks;
- low operational burden.

### Product and service signals

- faster time to first value;
- fewer dead ends and repeated steps;
- clearer progress and expectation setting;
- stronger error recovery;
- better self-service to assisted-service hand-offs;
- useful feedback loops;
- measurable customer outcomes.

### Team and organisational signals

- clearer ownership and decision rights;
- shorter learning and delivery loops;
- reduced coordination overhead;
- explicit escalation and accountability boundaries;
- incentives aligned with the desired outcome;
- practices that remain effective under normal operating pressure.

## Anti-patterns to avoid importing

- parity features with weak local value;
- architecture copied without matching constraints;
- rituals copied without the incentives or authority that make them work;
- impressive case-study outcomes with no causal evidence;
- collaboration features without collaboration demand;
- AI features without a clear workflow gain;
- central governance that removes useful local autonomy;
- local optimisation that harms the end-to-end customer journey;
- "enterprise" controls before actual enterprise need;
- permanent infrastructure built to test an uncertain hypothesis;
- a new abstraction, team, or process when an existing one can absorb the change.

## Experiment quality check

A good transfer experiment should specify:

- one bounded hypothesis;
- one target population, workflow, service, or module;
- the minimum enabling conditions;
- an accountable owner;
- baseline and success measures;
- expected failure modes;
- a review date or decision point;
- a rollback or stop condition.
