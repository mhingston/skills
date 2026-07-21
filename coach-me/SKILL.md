---
name: coach-me
description: Analyse the current user's real AI-session prompts to identify evidence-backed collaboration strengths, recurring friction, and high-leverage improvements, then produce a personalised working manual. Use when a user wants to understand and improve how they frame, steer, verify, and recover work with advanced models. Do not analyse another person's data or substitute general writing samples for AI-session evidence.
compatibility: Requires access to the current user's AI session history. Internet access is needed to refresh any external research benchmark used in the analysis.
---

# Coach Me

Analyse the current user's AI collaboration behaviour and produce a calibrated
coaching report grounded in their actual prompts. Do not write code or modify
repositories.

## Boundaries

- Analyse only the current user's data.
- Do not inspect another person's sessions, shared team transcripts, or private
  content merely because it is technically accessible.
- Quote only the minimum prompt excerpt needed to support a finding.
- Redact secrets, personal data, customer data, and unrelated content.
- Separate observed prompting behaviour from inference and external benchmarks.
- Do not infer stable ability, personality, or performance from a small or biased
  sample.

## 1. Establish the benchmark

When using an external research framework, fetch its current canonical source at
execution time. For the Anthropic Claude Code expertise study, use:

```text
https://www.anthropic.com/research/claude-code-expertise
```

Extract and record:

- publication or revision date when available;
- studied product, population, and task scope;
- definitions of expertise and success;
- measured dimensions and quantitative claims;
- study limitations and transfer caveats.

Do not hard-code or reuse remembered figures unless the source version has been
verified during the run. Do not apply Claude Code-specific results to general
chat, non-coding agents, or a different harness without an explicit caveat.

The benchmark is a comparison lens, not a scoring authority. The user's own
repeated evidence takes precedence over a generic population average.

## 2. Collect representative AI-session evidence

Use sources in this order:

1. current conversation turns;
2. the user's own tool-native AI session history;
3. user-provided representative prompts or exported transcripts.

Git commits, pull-request bodies, issues, emails, and other general writing may
provide adjacent communication context only. They must not substitute for AI
prompts, contribute to prompting-behaviour counts, or support claims about model
steering and recovery.

Sample guidance:

- 30 or more distinct user prompts across several sessions: full report;
- 10–29 prompts: preliminary report with explicit sample limits;
- fewer than 10 prompts: produce only a small watchlist or request more examples.

Prefer diversity across tasks, outcomes, and session stages. Avoid overweighting
one long project, repeated retries, or many prompts derived from the same failure.

## 3. Build an evidence table

For each prompt record:

- session and task context;
- stage: initial framing, clarification, steering, recovery, verification, or
  completion;
- observed behaviour;
- outcome evidence when available;
- uncertainty and plausible alternative interpretation.

Count one behavioural occurrence per independent prompt event. Several turns
responding to the same unresolved problem may form one correlated episode rather
than independent evidence.

## 4. Classify collaboration behaviours

Use evidence-backed categories such as:

### Helpful behaviours

- concrete outcome and scope;
- relevant constraints and explicit exclusions;
- pinned artefacts, versions, paths, or sources;
- decision rights and responsibility boundaries;
- explicit tool or skill routing when it reduces ambiguity;
- observable acceptance and verification criteria;
- concise course correction when evidence contradicts the agent;
- deliberate recovery after failure;
- separation of exploration, decision, implementation, and review;
- preservation of canonical sources and provenance.

### Friction behaviours

- several unrelated outcomes bundled without prioritisation;
- missing definition of done;
- important constraints arriving only after avoidable drift;
- ambiguous pivots that leave old requirements active;
- verification requests without a hard signal;
- repeated context that should be referenced rather than recopied;
- reliance on the model to infer authority, risk tolerance, or irreversible action;
- continuing after a failed prerequisite without reframing;
- technical identifier errors that materially change tool or package selection.

Do not treat natural-language typos, brevity, politeness, or stylistic preference
as weaknesses unless they repeatedly cause observable failure.

## 5. Assess outcomes and recovery

Where available, connect behaviours to hard evidence:

- tests, builds, committed changes, accepted pull requests, or other verified
  completion;
- user correction followed by successful recovery;
- repeated tool, scope, or reasoning failures;
- abandoned or restarted sessions;
- unnecessary turns, duplicated work, or lost evidence.

Do not equate more agent actions, longer output, or more tool calls with expertise.
Measure whether the interaction produced correct, verified, proportionate work.

## 6. Identify strengths and high-leverage changes

Require repeated evidence before calling a behaviour a strength or weakness.
Keep frequency, consequence, confidence, and trend separate.

Select:

- up to three strongest behaviours;
- up to three recurring friction patterns;
- two or three changes most likely to improve first-turn framing, steering,
  recovery, or verification.

For each improvement include:

- representative evidence;
- the observed cost or failure mode;
- a better version of the same prompt or interaction move;
- when the change should and should not be used;
- a future signal that would show improvement.

Do not prescribe elaborate prompt templates when a small concrete addition would
solve the problem.

## 7. Produce the report

Use this structure:

### Evidence and benchmark

State sample size, session diversity, sources, benchmark version, scope caveats,
and missing outcome evidence.

### Strongest collaboration behaviours

For each strength provide a short prompt excerpt, pattern, why it helps, and
confidence.

### Recurring friction

For each friction provide evidence, impact, alternative explanation, and a better
interaction move.

### Highest-leverage changes

Rank two or three changes by expected benefit and effort. Include before/after
examples grounded in the user's prompts.

### Personal working manual

Write a compact manual covering:

1. how the user frames and reasons about work;
2. where collaboration consistently succeeds;
3. where context, scope, or verification is commonly lost;
4. how an assistant should respond, challenge assumptions, and preserve evidence;
5. four or five durable habits ranked by leverage.

### Measurement plan

Name a small set of future indicators, such as verified completion rate,
clarification turns, recovery success, repeated constraint corrections, or
unverified completion claims. Do not create a pseudo-precise overall score.

## Output and privacy contract

Return the report in the conversation unless the user explicitly requests a
file. Do not commit it to a repository or persist session-derived personal data
without explicit consent.

Every material finding must cite or quote representative user evidence. Mark thin
or correlated samples as preliminary. State when outcome evidence is unavailable
rather than inferring success from fluent responses.
