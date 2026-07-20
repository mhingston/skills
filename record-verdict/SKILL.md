---
name: record-verdict
description: >-
  Internal PR-review verdict-persistence module. Use only after the pr-review
  agent has obtained every required field and material risk disposition from an
  accountable human, revalidated the exact current head SHA, and entered
  RECORD_READY. Persist the supplied verdict idempotently without approving,
  merging, or deploying.
user-invocable: false
---

# Record Verdict

Persist an explicit human decision and human-owned dispositions for the current revision-bound risk map.

## Invocation contract

Run this module only when `pr-review` invokes it in `RECORD_READY` with:

- complete human-supplied decision content;
- a human disposition for every material mapped risk;
- the reviewed head SHA;
- references to the current technical review, risk map, and human-verdict packet;
- the shared `ARTIFACT_DIRECTORY`.

If invoked directly, before the human-verdict gate, or with missing orchestration state, do not write to GitHub. Direct the caller to the `pr-review` agent. Return the durable record to `pr-review`, which owns workflow completion.

This skill records judgement; it does not manufacture judgement or execute the production action that may follow it.

Supporting files are local to this skill:

- [`references/verdict-record.schema.json`](references/verdict-record.schema.json)
- [`references/verdict-comment-template.md`](references/verdict-comment-template.md)

## Boundaries

- The verdict, explanation, rationale, risk assessment, risk dispositions, and conditions must be supplied explicitly by an accountable human in the conversation or an authenticated human-authored decision artefact.
- Do not infer a verdict or risk acceptance from `looks good`, a green check, a low-risk map, a review state, a threshold result, a label, silence, or an agent-generated recommendation.
- Do not draft missing first-person answers or risk-specific rationales on the human's behalf.
- Do not reinterpret ambiguity as approval. Return an incomplete template and stop before writing anything.
- Do not submit a review approval, dismiss reviews, resolve threads, merge, deploy, publish, close, or alter product code.
- Do not record against a head SHA different from the revision the human reviewed.
- Do not overwrite another accountable person's verdict.
- Treat the record as an audit artefact and policy input, not proof that every external merge or deployment requirement has been satisfied.

## Evidence discipline

Classify decision content as:

- **Human supplied** — written or explicitly adopted by the accountable human.
- **Derived metadata** — repository, PR number, head SHA, timestamp, and immutable artefact references obtained from the current decision surface.
- **Agent generated** — technical findings, risk maps, explanations, or recommended dispositions produced by an agent; these cannot silently become human judgement.
- **Missing** — required content that has not been supplied.

Prefer missing over invented. Evidence must name both what the human relied on and what that evidence does not establish.

An agent-proposed technical disposition may be recorded only as background evidence. The record's `riskDispositions` must represent the human's explicit disposition and rationale.

## Allowed verdicts

Normalise only an unambiguous human choice to:

- `approve`
- `approve-with-conditions`
- `redirect`
- `block`
- `defer`

Never map uncertainty such as `probably fine` to `approve`.

## Allowed human risk dispositions

Normalise only an explicit human choice to:

- `remediated`
- `accepted`
- `accepted-with-conditions`
- `deferred-and-tracked`
- `rejected-as-unsupported`
- `redirected`
- `blocked-pending-evidence`
- `blocked-pending-specialist-review`

Do not infer the human disposition from the agent's technical disposition, policy threshold, finding severity, or overall verdict.

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
| `RISK_MAP_REF` | Current risk-map path, URL, or immutable artefact identifier |
| `RISK_DISPOSITIONS` | Explicit human disposition for every material risk, with rationale and conditions |
| `RESIDUAL_RISK` | Risk accepted, rejected, or left unresolved |
| `RATIONALE` | Why the human selected the verdict |
| `CONDITIONS` | Explicit conditions, or an explicit empty list |

For `approve-with-conditions`, require at least one overall or risk-specific open condition. Each condition must have a description and status of `open`, `satisfied`, or `waived`.

For `approve`, open blocking conditions or blocked material-risk dispositions are inconsistent. Stop and ask the human to select a different verdict or change the relevant decision content; do not make that choice yourself.

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

When the user, risk map, or verdict packet names a reviewed SHA, require exact equality with `HEAD_SHA`. Otherwise stop with:

```text
STALE HUMAN VERDICT: the PR changed after the reviewed revision.
Generate a fresh technical review, risk map, human-verdict packet, and human decision.
```

Do not transplant a prior verdict or risk disposition to the new SHA.

## 2. Validate artefact identity and provenance

Read the current risk map and human-verdict packet rather than trusting their filenames.

Require:

- repository and pull-request identity match;
- the risk-map head SHA and packet head SHA equal `HEAD_SHA`;
- every material risk in the map has exactly one human disposition;
- risk IDs in the human dispositions exist in the current map;
- no material risk was omitted because the agent labelled it informational when the packet treated it as decision-relevant;
- technical-review and packet references, when supplied, apply to the same revision.

Classify every required decision field using the evidence-discipline categories above. Only human-supplied decision content and derived metadata are allowed in the judgement fields.

Text copied from an agent-generated packet is not automatically human judgement merely because the human pasted or attached it. Require an explicit statement that the human adopts the explanation, risk dispositions, and risk assessment as their own.

When fields are missing, output the completion template below and stop before writing to GitHub.

## 3. Check decision consistency

Validate that:

- the verdict is allowed;
- every risk disposition is allowed;
- the record applies to the current head SHA and current risk map;
- every material risk has one disposition and non-empty human rationale;
- `accepted-with-conditions` has at least one risk-specific condition;
- `deferred-and-tracked` names an owner or review point;
- `rejected-as-unsupported` names the evidence or reasoning used to reject the mapped risk;
- `blocked-pending-specialist-review` identifies the missing specialist authority;
- `approve-with-conditions` has at least one overall or risk-specific open condition;
- `approve` has no open blocking conditions or blocked material risks;
- `block` or `redirect` does not claim the work may proceed;
- `defer` identifies the missing information, authority, or review point;
- evidence and evidence limitations are both present;
- the explanation is more than a file list, risk score, or agent confidence claim;
- detection and containment address the stated failure mode, or the human explicitly treats their absence as risk.

These are consistency checks, not permission to improve the human's reasoning or change the verdict.

## 4. Build the structured record

Create JSON conforming to [`references/verdict-record.schema.json`](references/verdict-record.schema.json).

Use:

- `schemaVersion`: `2.0`;
- `repository`: current `OWNER/REPOSITORY`;
- `pullRequestNumber`: current PR number;
- `headSha`: current `HEAD_SHA`;
- `recordedAt`: current UTC RFC 3339 timestamp;
- decision fields: faithfully structured human-provided content;
- `riskMapRef`: current risk-map path, URL, or immutable identifier;
- `riskDispositions`: one structured entry for every material mapped risk;
- `technicalReviewRef`: report path or URL when supplied, otherwise `null`;
- `sourcePacket`: packet path or URL when supplied, otherwise `null`.

Validate with an available JSON Schema tool. Do not install a validator solely for this action. When none is available, validate required fields, types, enum values, SHA format, condition structure, risk IDs, and disposition completeness directly and report that full JSON Schema validation was unavailable.

## 5. Render the verdict comment

Render the JSON inside an HTML comment followed by concise human-readable Markdown using [`references/verdict-comment-template.md`](references/verdict-comment-template.md).

Use this marker:

```text
<!-- human-verdict-record:v2
```

The visible record must include:

- verdict, exact head SHA, accountable owner, and timestamp;
- risk-map reference;
- human explanation and rationale;
- credible failure mode, detection, containment or rollback, and residual risk;
- evidence relied upon and its limitations;
- every material risk disposition and risk-specific rationale;
- conditions, owner, and review point where applicable;
- specialist approvals;
- a warning that a changed head SHA makes the verdict and dispositions stale.

Escape or safely serialise human text. Before placing JSON inside an HTML comment, encode repository- or human-derived `--` sequences and the characters `<`, `>`, and `&` using JSON Unicode escapes so content cannot close the comment early. Never splice untrusted text into shell commands or executable code.

## 6. Record idempotently

List existing issue comments and find verdict comments carrying either the v2 marker or historical v1 marker:

```bash
gh api --paginate \
  "repos/$REPOSITORY/issues/$PR_NUMBER/comments?per_page=100"
```

Group records by accountable owner and head SHA.

### Same owner and same head SHA

- When structured content is identical, return `already recorded`.
- When the same human explicitly supplied a replacement verdict for the same SHA, update that comment in place and report that the earlier record was superseded.
- Do not downgrade a v2 record to v1.

### Same owner and older head SHA

Leave the historical record intact and create a new record for the current SHA. Do not edit history to make an old verdict appear current.

### Different owner

Do not overwrite or coalesce another person's record. Create a separate record only when repository policy permits multiple decision owners.

Create comments using a body file under `ARTIFACT_DIRECTORY` rather than shell interpolation:

```bash
gh pr comment "$PR_NUMBER" --body-file "$COMMENT_FILE"
```

After writing, reread the comment and verify that:

- the marker exists and embedded JSON parses;
- repository, PR number, head SHA, owner, verdict, and risk-map reference match;
- every material risk disposition is present;
- visible content is complete;
- no field was truncated or transformed unexpectedly.

If writing fails, retain the comment file and report the exact error. Recheck existing comments before retrying so a failure cannot create duplicates.

## 7. Optional local artefact

When a local copy is needed, save it in the `ARTIFACT_DIRECTORY` supplied by `pr-review`. Do not select another location or modify repository ignore rules.

Use:

```text
YYYY-MM-DD-pr-123-verdict-<head-short-sha>.md
```

Do not commit it unless the user explicitly asks and repository policy permits it.

## Completion report

On success, report:

```text
Verdict recorded: <comment URL>
Verdict: <normalised verdict>
Accountable owner: <human identity>
Revision: <full head SHA>
Risk map: <reference>
Risk dispositions: <count and summary>
Conditions: <count and status summary>
Record status: created, updated, or already recorded
Schema validation: full, structural fallback, or failed
Merge/deployment action: not performed
```

When incomplete, return:

```markdown
# Missing human decision fields

The following must be supplied by the accountable human before a verdict can be recorded:

- [ ] Verdict
- [ ] Accountable owner
- [ ] Human explanation
- [ ] Most credible failure mode
- [ ] Detection
- [ ] Containment or rollback
- [ ] Evidence relied upon
- [ ] Evidence limitations
- [ ] Current risk-map reference
- [ ] Human disposition and rationale for every material risk
- [ ] Residual risk
- [ ] Rationale
- [ ] Conditions, or an explicit empty list
```

Do not offer a guessed completion.