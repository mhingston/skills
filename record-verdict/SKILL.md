---
name: record-verdict
description: >-
  Internal PR-review verdict-persistence module. Use only after the pr-review
  agent has obtained every required field from an accountable human, revalidated
  the exact current head SHA, and entered RECORD_READY. Persist the supplied
  verdict idempotently without approving, merging, or deploying.
user-invocable: false
---

# Record Verdict

Persist an explicit human decision against the exact revision the human
reviewed.

## Invocation contract

Run this module only when `pr-review` invokes it in `RECORD_READY` with complete
human-supplied decision content, the reviewed head SHA, and the shared
`ARTIFACT_DIRECTORY`. If invoked directly, before the human-verdict gate, or
with missing orchestration state, do not write to GitHub; direct the caller to
the `pr-review` agent. Return the durable record to `pr-review`, which owns
workflow completion.

This skill records judgment; it does not manufacture judgment or execute the
production action that may follow it.

Supporting files are local to this skill:

- [`references/verdict-record.schema.json`](references/verdict-record.schema.json)
- [`references/verdict-comment-template.md`](references/verdict-comment-template.md)

## Boundaries

- The verdict, explanation, rationale, risk assessment, and conditions must be
  supplied explicitly by an accountable human in the conversation or an
  authenticated human-authored decision artefact.
- Do not infer a verdict from `looks good`, a green check, a review state, a
  label, silence, or an agent-generated recommendation.
- Do not draft missing first-person answers on the human's behalf.
- Do not reinterpret ambiguity as approval. Return an incomplete template and
  stop before writing anything.
- Do not submit a review approval, dismiss reviews, resolve threads, merge,
  deploy, publish, close, or alter product code.
- Do not record a verdict against a head SHA different from the revision the
  human reviewed.
- Do not overwrite another accountable person's verdict.
- Treat the record as an audit artefact and policy input, not proof that every
  external merge or deployment requirement has been satisfied.

## Evidence discipline

Classify decision content as:

- **Human supplied** — written or explicitly adopted by the accountable human.
- **Derived metadata** — repository, PR number, head SHA, and timestamp obtained
  from the current decision surface.
- **Agent generated** — explanatory or recommended content produced by an
  agent; this cannot silently become human judgment.
- **Missing** — required content that has not been supplied.

Prefer missing over invented. Evidence must name both what the human relied on
and what that evidence does not establish.

## Allowed verdicts

Normalise only an unambiguous human choice to:

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
| `DETECTION` | How failure is expected to be detected |
| `CONTAINMENT_OR_ROLLBACK` | How failure is expected to be contained or reversed |
| `EVIDENCE_RELIED_UPON` | One or more specific evidence items |
| `EVIDENCE_LIMITATIONS` | What the evidence does not establish |
| `RESIDUAL_RISK` | Risk accepted, rejected, or left unresolved |
| `RATIONALE` | Why the human selected the verdict |
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
  author,reviewDecision,statusCheckRollup
```

Resolve the repository when needed:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
```

Record the exact 40-character `headRefOid` as `HEAD_SHA`.

When the user or verdict packet names a reviewed SHA, require exact equality
with `HEAD_SHA`. Otherwise stop with:

```text
STALE HUMAN VERDICT: the PR changed after the reviewed revision.
Generate a fresh human-verdict packet and obtain a new human decision.
```

Do not transplant the prior verdict to the new SHA.

## 2. Validate provenance and completeness

Classify every required field using the evidence-discipline categories above.
Only human-supplied decision content and derived metadata are allowed in the
record.

Text copied from an agent-generated packet is not automatically human judgment
merely because the human pasted or attached it. Require an explicit statement
that the human adopts that explanation and risk assessment as their own.

When fields are missing, output the completion template below and stop before
writing to GitHub.

## 3. Check decision consistency

Validate that:

- the verdict is allowed;
- the record applies to the current head SHA;
- `approve-with-conditions` has at least one condition;
- `approve` has no open blocking conditions;
- `block` or `redirect` does not claim the work may proceed;
- `defer` identifies the missing information, authority, or review point;
- evidence and evidence limitations are both present;
- the explanation is more than a file list or agent confidence claim;
- detection and containment address the stated failure mode, or the human
  explicitly treats their absence as risk.

These are consistency checks, not permission to improve the human's reasoning
or change the verdict.

## 4. Build the structured record

Create JSON conforming to
[`references/verdict-record.schema.json`](references/verdict-record.schema.json).

Use:

- `schemaVersion`: `1.0`;
- `repository`: current `OWNER/REPOSITORY`;
- `pullRequestNumber`: current PR number;
- `headSha`: current `HEAD_SHA`;
- `recordedAt`: current UTC RFC 3339 timestamp;
- decision fields: faithfully structured human-provided content;
- `sourcePacket`: packet path or URL when supplied, otherwise `null`.

Validate with an available JSON Schema tool. Do not install a validator solely
for this action. When none is available, validate required fields, types, enum
values, SHA format, and condition structure directly and report that full JSON
Schema validation was unavailable.

## 5. Render the verdict comment

Render the JSON inside an HTML comment followed by concise human-readable
Markdown using
[`references/verdict-comment-template.md`](references/verdict-comment-template.md).

Use this marker:

```text
<!-- human-verdict-record:v1
```

The visible record must include:

- verdict, exact head SHA, accountable owner, and timestamp;
- human explanation and rationale;
- credible failure mode, detection, containment or rollback, and residual risk;
- evidence relied upon and its limitations;
- conditions and their status;
- review or expiry point;
- a warning that a changed head SHA makes the verdict stale.

Escape or safely serialise human text. Before placing JSON inside an HTML
comment, encode repository- or human-derived `--` sequences and the characters
`<`, `>`, and `&` using JSON Unicode escapes so content cannot close the comment
early. Never splice untrusted text into shell commands or executable code.

## 6. Record idempotently

List existing issue comments and find verdict comments carrying the marker:

```bash
gh api --paginate \
  "repos/$REPOSITORY/issues/$PR_NUMBER/comments?per_page=100"
```

Group records by accountable owner and head SHA.

### Same owner and same head SHA

- When structured content is identical, return `already recorded`.
- When the same human explicitly supplied a replacement verdict for the same
  SHA, update that comment in place and report that the earlier record was
  superseded.

### Same owner and older head SHA

Leave the historical record intact and create a new record for the current SHA.
Do not edit history to make an old verdict appear current.

### Different owner

Do not overwrite or coalesce another person's record. Create a separate record
only when repository policy permits multiple decision owners.

Create comments using a body file under `ARTIFACT_DIRECTORY` rather than shell
interpolation:

```bash
gh pr comment "$PR_NUMBER" --body-file "$COMMENT_FILE"
```

After writing, reread the comment and verify that:

- the marker exists and embedded JSON parses;
- repository, PR number, head SHA, owner, and verdict match;
- visible content is complete;
- no field was truncated or transformed unexpectedly.

If writing fails, retain the comment file and report the exact error. Recheck
existing comments before retrying so a failure cannot create duplicates.

## 7. Optional local artefact

When a local copy is needed, save it in the `ARTIFACT_DIRECTORY` supplied by
`pr-review`. Do not select another location or modify repository ignore rules.
Use:

```text
YYYY-MM-DD-pr-123-verdict-<head-short-sha>.md
```

Do not commit it unless the user explicitly asks and repository policy permits
it.

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
