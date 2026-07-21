---
name: record-verdict
description: >-
  Internal PR-review verdict-persistence module. Use only after the pr-review
  agent has obtained every required field and material risk disposition from an
  accountable human, revalidated the exact current head SHA, and entered
  RECORD_READY. Persist the supplied verdict idempotently without approving,
  merging, or deploying.
metadata:
  mhingston.internal: "true"
  mhingston.owner-agent: "pr-review"
  mhingston.user-invocable: "false"
compatibility: Requires read access to current pull-request evidence and authenticated permission to create or update issue comments.
---

# Record Verdict

Persist an explicit human decision against one exact revision. Record judgement
faithfully; never manufacture judgement or execute the production action that
may follow it.

Read these packaged resources before building or rendering a record:

- [`references/verdict-record.schema.json`](references/verdict-record.schema.json)
- [`references/verdict-comment-template.md`](references/verdict-comment-template.md)

## Invocation contract

Run only when `pr-review` supplies:

- `pr_review_agent_state: RECORD_READY`;
- the current repository and pull request;
- reviewed base and head SHAs;
- complete human-supplied decision content;
- one human disposition for every material mapped risk;
- current technical-review, risk-map, and human-verdict-packet references;
- `ARTIFACT_DIRECTORY`.

If invoked directly, before the decision gate, or without complete orchestration
state, do not write to GitHub. Return `REQUIRED_ORCHESTRATOR_CONTEXT` and direct
the caller to `pr-review`.

## Boundaries

- Do not infer a verdict, explanation, rationale, condition, risk acceptance, or
  disposition from agent output, green checks, review state, labels, silence, or
  phrases such as `looks good`.
- Do not draft missing first-person answers or improve the human's reasoning.
- Do not approve, dismiss reviews, resolve threads, merge, deploy, publish,
  close, or alter product code.
- Do not record against a different head SHA or overwrite another accountable
  person's verdict.
- Treat the record as an audit artefact and policy input, not proof that every
  external requirement is satisfied.

Classify fields as `human-supplied`, `derived-metadata`, `agent-generated`, or
`missing`. Judgement fields may contain only human-supplied content plus derived
identity and timestamp metadata. Text from an agent packet becomes human-owned
only when the human explicitly adopts it as their own.

## Allowed values

Normalise only an unambiguous human choice.

Verdicts:

- `approve`
- `approve-with-conditions`
- `redirect`
- `block`
- `defer`

Risk dispositions:

- `remediated`
- `accepted`
- `accepted-with-conditions`
- `deferred-and-tracked`
- `rejected-as-unsupported`
- `redirected`
- `blocked-pending-evidence`
- `blocked-pending-specialist-review`

## Required human content

Require:

- verdict and accountable owner;
- behavioural explanation in the human's own words;
- most credible failure mode;
- detection and containment or rollback;
- evidence relied upon and evidence limitations;
- current risk-map reference;
- one disposition, rationale, and applicable conditions for every material risk;
- residual risk and overall rationale;
- explicit conditions, or an explicit empty list.

For `approve-with-conditions`, require at least one open overall or risk-specific
condition. For `approve`, reject open blocking conditions or blocked material
risks. Do not choose a replacement verdict.

## Workflow

### 1. Resolve the current decision surface

Read current pull-request identity, state, base, and exact 40-character head SHA.
Require equality with the reviewed SHA in the packet and risk map.

If it differs, return:

```text
STALE_HUMAN_VERDICT: the decision surface changed after the reviewed revision.
Generate a fresh review, risk map, decision packet, and human decision.
```

Never transplant a verdict to a new revision.

### 2. Validate artefact identity and completeness

Read the current risk map and decision packet. Require:

- matching repository and pull-request identity;
- matching current head SHA;
- exactly one human disposition for every material risk;
- no unknown risk IDs and no omitted material risks;
- current technical-review and packet references;
- explicit human adoption of any reused agent-authored wording.

When any required decision field is missing or ambiguous, return an incomplete
checklist and stop before writing.

### 3. Check internal consistency

Validate that:

- verdict and dispositions use allowed values;
- each material risk has non-empty human rationale;
- `accepted-with-conditions` names a risk-specific condition;
- `deferred-and-tracked` names an owner or review point;
- `rejected-as-unsupported` identifies the evidence or reasoning;
- `blocked-pending-specialist-review` identifies the missing authority;
- `approve-with-conditions` has an open condition;
- `approve` has no blocked material risk or open blocking condition;
- `block` and `redirect` do not claim the work may proceed;
- `defer` identifies the missing evidence, authority, or review point;
- evidence and its limitations are both present;
- detection and containment address the chosen failure mode, or their absence is
  explicitly accepted as risk.

These checks detect contradiction; they do not author or change the decision.

### 4. Build and validate the structured record

Create JSON conforming to the packaged schema. Populate:

- `schemaVersion: "2.0"`;
- repository, pull-request number, exact head SHA, and UTC RFC 3339 timestamp;
- faithful human decision fields;
- current risk-map, technical-review, and source-packet references;
- one structured human disposition for every material risk.

Use an available JSON Schema validator. Do not install one solely for this task.
When unavailable, validate required fields, types, enums, SHA format, conditions,
risk IDs, and disposition completeness directly and report `structural fallback`.

### 5. Render a safe comment

Render the structured JSON in the packaged comment template. Use the marker:

```text
<!-- human-verdict-record:v2
```

The visible Markdown must include the verdict, revision, owner, timestamp,
human explanation and rationale, failure mode, detection, containment, evidence
and limitations, residual risk, every material risk disposition, conditions,
specialist input, and a warning that a changed head invalidates the record.

Before embedding JSON in an HTML comment, Unicode-escape repository- or
human-derived `--`, `<`, `>`, and `&` sequences. Never splice untrusted text into
shell commands or executable code.

### 6. Record idempotently

Read all existing pull-request issue comments and find v2 or historical v1
verdict markers. Group records by accountable owner and head SHA.

- Same owner, same SHA, identical content: return `already-recorded`.
- Same owner, same SHA, explicit replacement: update that comment in place.
- Same owner, older SHA: preserve history and create a new current record.
- Different owner: never overwrite or coalesce; create a separate record only
  when policy permits multiple decision owners.

Write from a body file under `ARTIFACT_DIRECTORY`, not shell interpolation.
After writing, reread and verify the marker, parseable JSON, repository, pull
request, head SHA, owner, verdict, risk-map reference, every material risk, and
visible content. Recheck existing comments before any retry.

## Missing-content response

When incomplete, return a checklist containing every missing human field and
risk disposition. Do not offer guessed wording.

## Completion report

On success report:

- comment URL and record status (`created`, `updated`, or `already-recorded`);
- normalised verdict and accountable owner;
- exact head SHA and risk-map reference;
- risk-disposition and condition counts;
- schema validation mode;
- confirmation that approval, merge, and deployment were not performed.
