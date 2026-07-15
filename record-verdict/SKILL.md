---
name: record-verdict
description: >-
  Use after an accountable human has explicitly chosen and explained a verdict
  for an existing pull request or consequential revision. Validate that the
  required decision fields came from the human, bind the verdict to the exact
  current head SHA, and create or update a structured GitHub verdict comment
  idempotently. Do not choose a verdict, write the human rationale, submit a
  review approval, merge, deploy, or treat the record as sufficient policy
  authorisation on its own.
---

# Record Verdict

Persist an explicit human decision against the exact revision the human
reviewed.

This skill records judgment; it does not manufacture judgment or execute the
production action that may follow it.

Apply:

- `../references/evidence-discipline.md`;
- `../references/verdict-record.schema.json`;
- `../references/verdict-comment-template.md`.

## Boundaries

- The verdict, explanation, rationale, risk assessment, and conditions must be
  supplied explicitly by an accountable human in the conversation or an
  authenticated human-authored decision artefact.
- Do not infer a verdict from phrases such as `looks good`, a green check, a
  GitHub review state, a label, silence, or an agent-generated recommendation.
- Do not draft missing first-person answers on the human's behalf.
- Do not reinterpret an ambiguous answer as approval. Stop and return a
  completion template listing the missing fields.
- Do not submit `gh pr review --approve`, dismiss reviews, resolve threads,
  merge, deploy, publish, close, or alter product code.
- Do not record a verdict against a head SHA different from the revision the
  human reviewed.
- Do not overwrite another accountable person's verdict. Create a separate
  record when policy permits multiple decision owners.
- Treat the recorded comment as an audit artefact and policy input, not as
  proof that every external merge or deployment requirement is satisfied.

## Allowed verdicts

Normalise only clear human choices to:

- `approve`
- `approve-with-conditions`
- `redirect`
- `block`
- `defer`

Never map uncertainty such as `probably fine` to `approve`.

## Required human-provided fields

Require all of the following:

| Field | Requirement |
| --- | --- |
| `VERDICT` | One allowed verdict |
| `ACCOUNTABLE_OWNER` | Human identity or role supplied by the human |
| `HUMAN_EXPLANATION` | Behavioural explanation in the human's own words |
| `MOST_CREDIBLE_FAILURE_MODE` | Human-selected failure mode |
| `DETECTION` | How the human expects failure to be detected |
| `CONTAINMENT_OR_ROLLBACK` | How the human expects it to be contained or reversed |
| `EVIDENCE_RELIED_UPON` | One or more specific evidence items |
| `EVIDENCE_LIMITATIONS` | What the evidence does not establish |
| `RESIDUAL_RISK` | Risk accepted, rejected, or left unresolved by the human |
| `RATIONALE` | Why the human selected this verdict |
| `CONDITIONS` | Explicit conditions, or an explicit empty list |

For `approve-with-conditions`, require at least one condition. Each condition
must have a description and status of `open`, `satisfied`, or `waived`.

For `approve`, open blocking conditions are inconsistent. Stop and ask the
human to select `approve-with-conditions` or change the conditions; do not make
that choice yourself.

## 1. Resolve the pull request and current revision

Resolve `PR` from an explicit number or URL, then the current branch. Read:

```bash
gh pr view "$PR" --json \
  number,url,title,state,isDraft,baseRefName,headRefName,headRefOid,\
  repository,author,reviewDecision,statusCheckRollup
```

Where the installed `gh` version does not expose `repository`, derive the
`OWNER/REPOSITORY` value from:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
```

Record the exact 40-character `headRefOid` as `HEAD_SHA`.

If the user or verdict packet names a reviewed SHA, require exact equality with
`HEAD_SHA`. Otherwise stop with:

```text
STALE HUMAN VERDICT: the PR changed after the reviewed revision.
Generate a fresh human-verdict packet and obtain a new human decision.
```

Do not transplant the prior verdict to the new SHA.

## 2. Validate provenance and completeness

Classify every required field as:

- `human supplied`;
- `derived metadata` such as PR number, repository, head SHA, or timestamp;
- `missing`;
- `agent generated`.

Only human-supplied decision content and derived metadata are allowed in the
record. Text copied from an agent-generated packet is not automatically human
judgment merely because the human attached or pasted it. Require an explicit
statement that the human adopts the explanation and risk assessment as their
own when that is genuinely their intent.

When fields are missing, output an unfilled template and stop before writing to
GitHub.

## 3. Check decision consistency

Validate:

- the verdict is allowed;
- the record applies to the current head SHA;
- `approve-with-conditions` has at least one condition;
- `approve` has no open blocking conditions;
- `block` or `redirect` does not misleadingly claim that the work may proceed;
- `defer` identifies the missing information, authority, or review point in the
  rationale or conditions;
- evidence and limitations are both present;
- the human explanation is not merely a file list or agent confidence claim;
- detection and containment are meaningful for the stated failure mode, or the
  human explicitly says they are unavailable and treats that as risk.

These are consistency checks, not permission to improve the human's reasoning
or change the verdict.

## 4. Build the structured record

Create JSON conforming to
`../references/verdict-record.schema.json`.

Use:

- `schemaVersion`: `1.0`;
- `repository`: current `OWNER/REPOSITORY`;
- `pullRequestNumber`: current PR number;
- `headSha`: current `HEAD_SHA`;
- `recordedAt`: current UTC RFC 3339 timestamp;
- decision fields: faithfully structured human-provided content;
- `sourcePacket`: packet path or URL when supplied, otherwise `null`.

Validate the JSON with an available JSON Schema tool. Do not install a new
validator solely for this action. When none is available, validate required
fields, types, enum values, SHA format, and condition structure directly and
report that full JSON Schema validation was unavailable.

## 5. Render the verdict comment

Render the machine-readable JSON inside an HTML comment followed by a concise
human-readable Markdown record using
`../references/verdict-comment-template.md`.

Use the marker:

```text
<!-- human-verdict-record:v1
```

The visible record must include:

- verdict;
- PR head SHA;
- accountable owner;
- timestamp;
- human explanation;
- credible failure mode;
- detection;
- containment or rollback;
- evidence relied upon;
- evidence limitations;
- residual risk;
- rationale;
- conditions and their status;
- review or expiry point;
- a warning that the verdict becomes stale when the head SHA changes.

Escape or safely serialise human text. Before placing JSON inside an HTML
comment, encode any repository- or human-derived `--` sequence and the
characters `<`, `>`, and `&` using JSON Unicode escapes so content cannot close
the comment early. Never splice untrusted text into shell commands or executable
code.

## 6. Record idempotently

List existing issue comments and find verdict comments carrying the marker:

```bash
gh api --paginate \
  "repos/$REPOSITORY/issues/$PR_NUMBER/comments?per_page=100"
```

Group existing records by accountable owner and head SHA.

### Same owner and same head SHA

If an existing record has identical structured content, return it as
`already recorded` and do not create a duplicate.

If the same accountable owner explicitly supplied a replacement verdict for the
same SHA, update that comment in place with `gh api --method PATCH` and report
that the earlier record was superseded. Do not update based merely on agent
inference.

### Same owner and older head SHA

Do not edit history to make the old verdict appear current. Leave the old
record intact and create a new record for the current SHA. The new record should
state that previous records for that owner apply only to older revisions.

### Different owner

Do not overwrite or coalesce another person's record. Create a separate record
when the repository's policy permits it.

Create a new comment with a body file rather than shell interpolation:

```bash
gh pr comment "$PR_NUMBER" --body-file "$COMMENT_FILE"
```

After writing, reread the created or updated comment and verify:

- the marker exists;
- embedded JSON parses;
- repository, PR number, head SHA, owner, and verdict match;
- visible content is complete;
- no field was truncated or transformed unexpectedly.

If writing fails, retain the comment file in the artifact directory and report
the exact error. Do not retry in a way that can create duplicates without first
checking existing comments again.

## 7. Optional local artefact

Save a copy outside the repository as:

```text
YYYY-MM-DD-pr-123-verdict-<head-short-sha>.md
```

Do not commit the artefact unless the user explicitly asks and repository policy
permits it.

## Completion report

On success, report:

```text
Verdict recorded: <comment URL>
Verdict: <normalised verdict>
Accountable owner: <human identity>
Revision: <full head SHA>
Conditions: <count and status summary>
Record status: created, updated, or already recorded
Schema validation: full, structural fallback, or failed
Merge/deployment action: not performed
```

When incomplete, return:

```markdown
# Missing human decision fields

The following must be supplied by the accountable human before a verdict can be
recorded:

- [ ] Verdict
- [ ] Accountable owner
- [ ] Human explanation
- [ ] Most credible failure mode
- [ ] Detection
- [ ] Containment or rollback
- [ ] Evidence relied upon
- [ ] Evidence limitations
- [ ] Residual risk
- [ ] Rationale
- [ ] Conditions, or an explicit empty list
```

Do not offer a guessed completion.
