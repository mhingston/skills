---
name: contributor-analysis
description: Analyse repository contribution history to find likely reviewers, current stewardship, knowledge coverage, onboarding contacts, and continuity gaps. Use when a team needs evidence-backed contributor or subsystem knowledge mapping. Do not use for productivity ranking, performance assessment, personality inference, personal-life profiling, employment decisions, or conclusions from commit counts alone.
compatibility: Requires Python 3.9+ and a local Git repository with the history needed for the selected time window.
---

# Contributor Analysis

Use repository evidence to answer bounded engineering questions about contribution,
stewardship, reviewer discovery, knowledge coverage, and continuity. Produce leads that
people can confirm, not profiles or verdicts about contributors.

## Use when

Use this skill to:

- identify likely reviewers or subject-matter contacts for a path or change;
- map which contributors have recently changed a subsystem;
- compare historical knowledge with recent stewardship;
- find areas whose review or maintenance coverage needs confirmation;
- prepare onboarding conversations and recommended code-reading contacts;
- identify succession, handover, or documentation questions;
- distinguish broad participation from highly concentrated contribution history.

Use `git-archaeologist` instead when the primary question concerns change hotspots,
fix-associated paths, operational churn, or repository-level investigation priority.

## Do not use when

Do not use this skill to:

- rank productivity, impact, quality, diligence, velocity, or value;
- infer personality, psychology, communication style, motivation, health, personal
  circumstances, relationships, sobriety, working habits, or likely behaviour;
- decide promotion, compensation, hiring, firing, performance management, disciplinary
  action, or other employment outcomes;
- claim ownership, authority, availability, or current team membership from Git alone;
- interpret commit timestamps as working hours or work-life balance;
- attribute commit-message writing style to a contributor without provenance;
- create compatibility scores, management dossiers, or advice on how to handle a
  particular person.

Stop and explain the boundary if the requested output crosses one of these lines.
Offer a systems-focused alternative such as stewardship coverage, reviewer candidates,
documentation gaps, or unowned operational responsibilities.

## Fast path

Run the bundled read-only collector:

```bash
python3 <skill-directory>/scripts/analyse-contributors.py \
  --repo <repository-root> \
  --ref HEAD \
  --since "6 months ago" \
  --top 20
```

For a bounded subsystem, add one or more path scopes:

```bash
python3 <skill-directory>/scripts/analyse-contributors.py \
  --repo <repository-root> \
  --since "12 months ago" \
  --path src/payments \
  --path tests/payments
```

The collector emits name-only, mailmap-aware JSON containing contributor activity,
active months, first and last observed dates, top paths and areas, and area-level
contribution concentration. It deliberately omits email addresses, commit subjects,
exact timestamps, and inferred traits.

## Workflow

### 1. Define the legitimate engineering question

Write one question the analysis must help answer, such as:

- Who has recent, relevant evidence for reviewing this payment change?
- Which subsystems need broader review or documentation coverage?
- Who should an engineer speak with while onboarding to this component?
- Has stewardship shifted from historical contributors to a newer group?

Reject vague requests to "analyse the developers". Convert them into a bounded
repository, path, time window, and engineering decision.

### 2. Establish purpose and data boundaries

Record:

- repository root, revision, path scope, and time windows;
- why contributor-level data is necessary for the stated engineering purpose;
- whether the clone is shallow or missing relevant branches or tags;
- `.mailmap`, bots, service accounts, shared identities, co-authored work, pair or mob
  programming, squashes, rebases, imports, and repository moves;
- generated, vendored, lockfile, migration, snapshot, and bulk-formatting exclusions;
- whether repository history may be processed by the selected model or external
  service under the organisation's policy;
- which fields are necessary to retain in any artefact.

Prefer aggregate or path-level evidence when names are not necessary. Do not treat an
enterprise product subscription as proof that a particular repository or personal-data
transfer is authorised.

### 3. Select windows that match the question

Use at least two windows when recency matters:

- a recent window, such as 90 days or 6 months, for current contribution evidence;
- a longer window, such as 1–2 years, for historical depth and stewardship shifts.

Do not compare windows with different available history without stating the gap. A
contributor absent from a recent window may have changed role, worked elsewhere,
contributed through pairing, used another identity, or simply had no relevant changes.
Absence does not establish departure, disengagement, or lack of knowledge.

### 4. Collect mechanical evidence

Run the bundled script for each selected window. Preserve the JSON when the environment
supports evidence artefacts.

Interpret fields literally:

- `commit_count` — matching non-merge commits attributed to the normalised author name;
- `active_months` — distinct calendar months containing matching commits;
- `first_observed` and `last_observed` — dates in the selected history, not employment
  dates or availability;
- `top_paths` and `top_areas` — paths or grouped areas appearing in matching commits;
- `unique_contributors` — distinct normalised names observed for an area;
- `top_contributor_share` — the largest share of matching area commit-touches, not bus
  factor, ownership, authority, or irreplaceability.

Use `--exclude` for repository-justified noise. The collector excludes merge commits by
default because merge strategy can dominate author counts; use `--include-merges` only
when the repository's merge semantics make that evidence useful and document why.

### 5. Corroborate candidates against current evidence

For each consequential lead, inspect enough evidence to answer:

- Is the contributor's activity recent enough for this decision?
- Did the commits materially change behaviour, tests, architecture, operations, or only
  formatting, versions, generated output, or bulk migration artefacts?
- Does the current code still resemble the historical version they changed?
- Do CODEOWNERS, maintainers, recent review history, pull requests, ADRs, runbooks,
  incident records, and team information agree with the Git signal?
- Is the candidate available and willing to review or advise?
- Was work paired, co-authored, squashed, rebased, imported, or attributed to a service
  account?
- Are there current maintainers whose knowledge is not represented in commit history?

Use repository-native review evidence when available. Git authorship is only one source.
Never use `git blame` as fault attribution or as a substitute for asking the team.

### 6. Answer by engineering purpose

#### Reviewer discovery

Rank candidates using:

1. recent material changes to the affected paths;
2. relevant tests, architecture, or operational changes;
3. current review or maintainer evidence;
4. breadth across dependencies touched by the proposed change;
5. explicit availability and team confirmation.

Report `candidate reviewer` or `relevant contributor`, not `owner` or `expert`, unless a
current authoritative source establishes that status.

#### Knowledge and stewardship mapping

Report by subsystem rather than producing a leaderboard of people. Highlight:

- recent and historical contributor coverage;
- whether current stewardship is confirmed or unclear;
- review, documentation, test, runbook, and observability coverage;
- concentration that warrants a handover or resilience conversation;
- contradictory evidence and the next confirmation step.

#### Onboarding

Recommend a reading and conversation order:

1. current code and tests;
2. ADRs, runbooks, and operational documentation;
3. recent material changes and their reviews;
4. confirmed maintainers or relevant contributors;
5. historical context only where it still affects current invariants.

Do not generate personality summaries or advice about how to communicate with named
contributors.

### 7. Separate evidence from interpretation

For every important observation use:

| Engineering question | Direct evidence | Calibrated interpretation | Plausible alternatives | Confirmation step |
| --- | --- | --- | --- | --- |

Examples:

- Concentrated recent changes may indicate focused stewardship, a short project phase,
  squash attribution, pairing, or incomplete history. It is not a bus-factor verdict.
- Broad path coverage may indicate cross-cutting work, migrations, dependency updates,
  release duties, or genuine subsystem breadth.
- Historical depth with little recent activity may still provide architectural context,
  but it does not establish current ownership or availability.
- Frequent test changes may indicate domain knowledge, regression work, generated
  snapshots, or adaptation to implementation changes elsewhere.

### 8. Produce the report

Return:

1. **Decision and scope** — engineering question, repository, revision, paths, windows,
   exclusions, and policy constraints.
2. **Evidence quality** — history completeness, identity normalisation, merge strategy,
   automation, pairing, and missing sources.
3. **Subsystem coverage** — recent and historical evidence by area.
4. **Relevant contributors** — only where names are necessary, with evidence,
   confidence, alternatives, and confirmation steps.
5. **Continuity questions** — concentrated areas requiring documentation, review,
   handover, or stewardship confirmation.
6. **Recommended actions** — conversations, reviewers to confirm, docs to improve,
   code to read, or ownership records to update.
7. **Limitations** — what Git history cannot establish.

Use calibrated language: `recent contribution evidence`, `candidate reviewer`,
`stewardship requires confirmation`, `history concentration`, and `not established by
Git history`.

## Privacy and retention

- Minimise personal data. Names are included only when needed for the engineering
  purpose; email addresses are never emitted by the collector.
- Do not retain raw commit messages, exact timestamps, or full history exports unless
  separately justified.
- Avoid sending proprietary history to an unapproved external service.
- Prefer local collection and a reduced evidence artefact over uploading a repository.
- Apply organisational retention, access-control, and deletion requirements to reports.
- Do not enrich repository identities with social media, personal accounts, or external
  personal data to construct a profile.

## Script contract

`analyse-contributors.py`:

- uses only the Python standard library and Git CLI;
- accepts `--repo`, `--ref`, `--since`, bounded `--top`, repeated `--path`, repeated
  `--exclude`, `--path-depth`, and optional `--include-merges` inputs;
- invokes Git with argument arrays rather than shell interpolation;
- performs no writes;
- applies `.mailmap` through Git's mailmap-aware author placeholders;
- emits names but not email addresses, commit messages, or exact timestamps;
- returns deterministic JSON for the same repository state and arguments;
- reports shallow history and empty windows explicitly;
- exits non-zero with a JSON error on stderr for fatal prerequisites.

After changing the script, run:

```bash
python3 <skill-directory>/scripts/test-analyse-contributors.py
```

## Stop conditions

Stop and report the missing prerequisite or invalid purpose when:

- the target is not a Git repository;
- the requested revision is unavailable;
- history is too shallow or incomplete for the question;
- identity ambiguity materially changes the result;
- repository processing is not authorised for the selected environment;
- current code, review, ownership, or organisational evidence cannot corroborate a
  consequential claim;
- the user requests performance, employment, psychological, personality, personal-life,
  behavioural, health, or work-habit profiling.
