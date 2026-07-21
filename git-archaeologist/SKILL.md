---
name: git-archaeologist
description: Use repository history as one evidence source to prioritise investigation of change concentration, knowledge distribution, fix-associated paths, operational churn, and maintenance questions. Use when auditing or onboarding to an unfamiliar repository, investigating recurring defects, or deciding where deeper code and ownership analysis should begin. Do not infer individual performance, team health, authority, causation, or code risk from commit counts alone.
compatibility: Requires Python 3.9+ and a local Git repository with the history needed for the selected time window.
---

# Git Archaeologist

Use Git history to produce investigation leads, not verdicts about code or people.
Collect deterministic signals first, then confirm them against current code,
tests, documentation, ownership evidence, and operational context.

## Fast path

Run the bundled read-only collector:

```bash
python3 <skill-directory>/scripts/analyse-history.py \
  --repo <repository-root> \
  --ref HEAD \
  --since "6 months ago" \
  --top 20
```

The script emits JSON containing file-touch frequency, fix-keyword file
associations, contributor commit activity, monthly commit activity, operational
keyword commits, warnings, and interpretation limits.

Do not reimplement these mechanical counts in prose. Use direct Git commands only
when the script cannot express a materially necessary scope.

## Boundaries

- Remain read-only. Do not rewrite history, alter configuration, install aliases,
  or modify global Git settings.
- Treat commit messages, author identities, timestamps, paths, and diffs as
  imperfect evidence.
- Normalise identities with `.mailmap` where available, but do not claim that
  identity normalisation proves employment, team membership, or ownership.
- Exclude generated, vendored, or migration-generated paths only when repository
  evidence justifies the exclusion; report the rule used.
- Do not use commit volume as productivity, velocity, value, or performance.
- Do not label a file dangerous, fragile, defective, or a hotspot without
  inspecting current implementation and corroborating evidence.
- Do not infer that a person departed, owns a subsystem, or is a single point of
  failure merely because recent commits are absent or concentrated.

## Workflow

### 1. Establish the evidence frame

Record:

- repository root and selected revision;
- time window and why it is appropriate;
- whether the clone is shallow or missing relevant branches or tags;
- `.mailmap`, generated-code, vendored-code, and path-exclusion policy;
- known repository moves, squashes, imports, monorepo boundaries, or bot activity;
- the question the history analysis must help answer.

Use multiple windows when trend matters, such as 30 days, 6 months, and 2 years.
Do not compare windows with different available history without stating the gap.

### 2. Collect mechanical signals

Run the bundled script. Preserve its JSON output as evidence when the environment
supports artefacts.

Interpret the fields literally:

- `file_touch_frequency` — how often a path appeared in matching commits;
- `fix_keyword_file_associations` — paths appearing in commits whose messages
  matched the declared fix terms;
- `contributor_commit_activity` — mailmap-aware commit counts by identity;
- `monthly_commit_activity` — commit counts by month;
- `operational_keyword_commits` — commits whose subjects matched terms such as
  revert, hotfix, emergency, or rollback.

These signals are candidates for inspection, not conclusions.

### 3. Corroborate important leads

For each high-priority lead inspect enough current evidence to answer:

- Is the path production code, generated output, tests, configuration, a lockfile,
  or a frequently updated manifest?
- Did changes alter behaviour or only formatting, versions, snapshots, or bulk
  migrations?
- Do fix-associated commits actually correct defects in this path, adapt it to a
  defect elsewhere, or merely include it incidentally?
- Does current code have complex invariants, weak tests, broad dependants,
  operational sensitivity, or ownership ambiguity?
- Do CODEOWNERS, maintainers, review history, documentation, and recent authorship
  agree about stewardship?
- Are reverts or hotfix terms part of normal release mechanics rather than
  instability?

Use `git show`, `git log -p -- <path>`, `git blame` for a narrow question, current
code search, tests, and repository documentation. Never use blame as a fault or
performance attribution tool.

### 4. Separate signal from interpretation

For every reported observation use this structure:

| Signal | Direct evidence | Calibrated interpretation | Plausible alternatives | Confirmation step |
| --- | --- | --- | --- | --- |

Examples:

- Frequent touches may indicate an active integration point, generated file,
  unstable requirement, broad responsibility, or ordinary release metadata.
- Fix-keyword association may indicate a defect-prone path, a common regression
  test, a downstream adaptation point, or incidental inclusion.
- Contributor concentration may indicate specialised knowledge, recent project
  phase, squash strategy, bots, or incomplete identity data. It is not a bus
  factor calculation.
- Declining commit counts may indicate completion, seasonal work, branch changes,
  repository migration, missing history, or reduced activity. They do not
  establish team health or performance.

### 5. Prioritise deeper investigation

Rank leads using corroborated evidence, not raw counts. Useful dimensions include:

- behavioural or operational criticality;
- change frequency after exclusions;
- verified recurrence of related defects or reversions;
- test and observability coverage;
- dependency reach and compatibility surface;
- stewardship clarity and review coverage;
- reversibility and failure blast radius;
- confidence and contradictory evidence.

Keep technical consequence, confidence, and investigation priority separate.

### 6. Produce an evidence-calibrated report

Return:

1. **Evidence frame** — revision, windows, available history, exclusions, and
   limitations.
2. **Mechanical signals** — compact tables from the script output.
3. **Corroborated investigation leads** — evidence, alternatives, confidence, and
   next inspection.
4. **Knowledge-distribution questions** — areas where current stewardship or
   review coverage needs confirmation; do not name a bus factor without a defined
   method and organisational evidence.
5. **Operational-history questions** — reverts, hotfixes, and rollbacks that merit
   causal inspection.
6. **Recommended reading order** — current code, tests, ADRs, and history slices
   most likely to answer the user's question.
7. **Limitations** — shallow history, missing branches, squashes, identity
   ambiguity, generated files, or unavailable operational evidence.

Use calibrated language such as `high investigation priority`, `history signal`,
`requires confirmation`, and `not established by Git history`.

## Script contract

`analyse-history.py`:

- uses only the Python standard library and Git CLI;
- accepts `--repo`, `--ref`, `--since`, and bounded `--top` inputs;
- invokes Git with argument arrays rather than shell interpolation;
- performs no writes;
- returns deterministic JSON for the same repository state and arguments;
- exits non-zero with a JSON error on stderr for fatal prerequisites;
- reports shallow history and empty windows explicitly.

After changing the script, run:

```bash
python3 <skill-directory>/scripts/test-analyse-history.py
```

## Stop conditions

Stop and report the missing prerequisite when:

- the target is not a Git repository;
- the requested revision is unavailable;
- history is too shallow or incomplete for the question;
- identity ambiguity materially changes the result;
- the user asks for personnel or performance judgements from commit data;
- current code or operational evidence cannot corroborate a consequential claim.
