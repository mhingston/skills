# Review report contract

## Contents

- [Dimension result](#dimension-result)
- [Finding schema](#finding-schema)
- [Severity, confidence, and disposition](#severity-confidence-and-disposition)
- [Falsification](#falsification)
- [Risk map](#risk-map)
- [Evidence rules](#evidence-rules)
- [Rendered report](#rendered-report)

## Dimension result

Require each baseline or change-specific review dimension to return this logical shape. JSON is preferred when the harness preserves it reliably.

```json
{
  "dimension": "correctness",
  "dimension_type": "baseline",
  "reason_selected": "Always required",
  "topology_evidence": ["src/orders/service.ts:40-88"],
  "primary_question": "Can the changed retry path produce an incorrect externally visible result?",
  "findings": [],
  "strengths": [],
  "coverage": "What this dimension inspected",
  "limitations": []
}
```

`dimension_type` is `baseline` or `change-specific`. A change-specific result must explain why it was selected. An empty finding list is valid.

## Finding schema

Each candidate finding uses this logical shape:

```json
{
  "id": "COR-1",
  "dimension": "correctness",
  "severity": "blocker",
  "confidence": "high",
  "likelihood": "high",
  "file": "path/to/file",
  "line": "42 or 42-51",
  "title": "Concise behavioural finding",
  "evidence": "Exact code or diff excerpt",
  "impact": "Failure, exposure, mismatch, regression, or maintenance cost",
  "failure_path": "Concrete input, event sequence, attack path, or causal interaction",
  "affected_boundary": "Persistence transaction",
  "suggested_fix": "Smallest concrete corrective direction",
  "verified": true,
  "falsification_attempts": [],
  "related_findings": [],
  "policy_threshold": "major or no-policy",
  "threshold_result": "exceeded",
  "disposition": "remediate-before-merge"
}
```

Use a meaningful dimension prefix such as `COR`, `SEC`, `SPC`, `TST`, `DSN`, `DAT`, `CON`, `CMP`, `PRV`, `RES`, `OPS`, or a clear domain-specific prefix. Finding IDs only need to be stable within the report; the synthesiser may renumber after deduplication.

Do not require a single file or line for a compound risk. Instead cite every contributing location and link the underlying finding IDs.

## Severity, confidence, and disposition

Keep these concepts separate.

### Severity

Severity expresses the supported technical consequence and likelihood, not reviewer confidence, enthusiasm, or repository policy.

#### Blocker

The change would ship an unacceptable, difficult-to-recover failure: exploitable security breach, silent data corruption, broken documented flow, material requirement reversal, irreversible migration failure, or similarly consequential defect. A blocker must have a concrete failure or attack path and direct evidence. Design taste is never a blocker by itself.

#### Major

The change is technically shippable but carries material correctness, security, requirement, regression, compatibility, operational, or maintenance risk that should be resolved before merge or explicitly tracked and accepted. Name the credible cost of deferral.

#### Minor

The issue is bounded and optional: a small robustness gap, focused missing edge test, misleading name, local simplification, or maintainability improvement. The author can reasonably address, defer, or reject it.

When between severities, choose the lower severity unless evidence establishes the higher consequence.

### Confidence

- **High** — the failure or conflict follows directly from inspected code and current evidence.
- **Medium** — the causal path is well supported but one environmental, runtime, or policy fact remains inferred.
- **Low** — the concern is plausible but requires material confirmation; normally place it in `Unverified` rather than a validated finding.

### Likelihood

Use `high`, `medium`, `low`, or `unknown`. State the preconditions. Do not infer production frequency from code alone.

### Policy threshold

Use the exact applicable repository policy when supplied. Otherwise use `no-policy`. Do not invent organisational rules.

`threshold_result` is:

- `exceeded` — supported severity meets or exceeds an applicable threshold;
- `not-exceeded` — an applicable threshold exists but is not met;
- `no-policy` — no relevant threshold was established.

### Technical disposition

A disposition routes attention; it is not a human verdict.

- `remediate-before-merge`
- `human-attention-required`
- `specialist-review-required`
- `explicit-risk-acceptance`
- `redirect-to-design`
- `track-as-debt`
- `informational`
- `not-applicable`

When no policy exists, choose the most conservative evidence-backed disposition without inventing authority. A blocker normally maps to `remediate-before-merge`; a material trust, privacy, data, or regulatory unknown may map to `specialist-review-required`; an unresolved upstream architectural decision may map to `redirect-to-design`.

## Falsification

Before a candidate becomes a validated finding, record one or more attempts to disprove it:

```json
{
  "hypothesis": "Existing validation prevents the invalid state",
  "evidence_checked": "src/orders/validator.ts:12-38",
  "result": "did-not-falsify",
  "notes": "Validation runs before create but not before retry replay"
}
```

`result` is `falsified`, `did-not-falsify`, or `inconclusive`.

Drop a falsified candidate. Put an inconclusive material concern in `Unverified` with the exact next check. Do not describe absence of evidence as successful falsification.

## Risk map

Produce a risk map bound to the exact reviewed revisions:

```json
{
  "schema_version": 1,
  "scope": "pull request 123",
  "base_sha": "40-character SHA",
  "head_sha": "40-character SHA",
  "generated_at": "RFC-3339 timestamp",
  "execution_mode": "independent dimension workers",
  "spec_source": "issue URL or none",
  "dimensions": [
    {
      "name": "data integrity and migration safety",
      "type": "change-specific",
      "reason_selected": "The diff adds an irreversible backfill",
      "coverage": "Migration, restart, replay, and rollback",
      "limitations": []
    }
  ],
  "risks": [
    {
      "id": "RISK-1",
      "finding_ids": ["DAT-1"],
      "dimension": "data integrity and migration safety",
      "risk": "Restarting the migration can duplicate balances",
      "affected_boundary": "Account ledger",
      "evidence": ["migrations/2026_07_backfill.sql:18-44"],
      "severity": "blocker",
      "likelihood": "medium",
      "confidence": "high",
      "policy_threshold": "major",
      "threshold_result": "exceeded",
      "disposition": "remediate-before-merge",
      "detection": "Reconciliation mismatch metric",
      "containment_or_reversal": "Stop migration and restore checkpoint",
      "related_risks": []
    }
  ],
  "compound_risks": [],
  "unverified": [],
  "technical_posture": "Blocking technical risk identified."
}
```

Risk-map IDs are stable only within the reviewed revision. Any head change makes the map stale.

A compound risk must state the causal interaction, contributing finding or risk IDs, combined consequence, and evidence. Do not create one merely because findings share a file or label.

## Evidence rules

- Cite a verified repository-relative path and current line or tight range.
- Quote the smallest excerpt that proves the claim.
- Explain observable impact rather than naming a pattern alone.
- Separate confirmed findings from unverified suspicions.
- Put runtime-, production-, configuration-, policy-, or dependency-sensitive claims in `Unverified` unless the required evidence was inspected.
- For diff reviews, establish that the change introduced the issue or made it materially reachable.
- Require an attack or exposure path for security findings.
- Require a quoted requirement for confirmed specification findings.
- Require a concrete regression that a proposed missing test would catch.
- Do not report formatting or lint issues enforced automatically by configured tooling unless that tooling is absent or demonstrably failing.
- Cap strengths at three. Every strength needs a path, line, and specific reason it is worth retaining.
- An empty result is valid. State coverage and limitations instead of inventing a finding.
- Do not let a policy threshold replace technical evidence, and do not let technical severity manufacture a human verdict.

## Rendered report

Use this order:

```markdown
# Review: <scope>

<Technical posture and severity counts>

**Scope:** <working tree, revisions, PR, range, path, or module>
**Base / head:** <exact revisions, or not applicable>
**Execution:** <independent dimension workers | single-context fallback | single-pass fast path>
**Spec source:** <source or none>
**Dimensions:** <baseline and change-specific dimensions covered>
**Risk map:** <artefact path/link or embedded summary>

## Risk map

| Risk | Dimension | Severity | Confidence | Threshold | Disposition |
| --- | --- | --- | --- | --- | --- |

## Findings

| Severity | Dimension | Location | Finding |
| --- | --- | --- | --- |

### [ID] Title

**Location:** `path:line`
**Evidence:** <quoted excerpt>
**Failure path:** <concrete sequence or causal interaction>
**Impact:** <concrete consequence>
**Confidence / likelihood:** <values and preconditions>
**Falsification:** <what was checked and result>
**Threshold / disposition:** <policy result and technical routing>
**Suggested fix:** <direction, not an unsolicited patch>

## Compound risks

- <interaction, contributing IDs, combined consequence, and evidence>

## Unverified

- <suspicion, why unverified, and exact confirmation step>

## Strengths

- `path:line` — <specific evidenced practice>

## Coverage and limitations

- <what was inspected, unavailable, skipped, or not executed>
```

Omit empty `Compound risks`, `Unverified`, and `Strengths` sections. Keep the summary and risk map scannable. Do not hide a blocker beneath strengths or methodology.

Use only these technical postures:

- `Blocking technical risk identified.`
- `Material technical risks require remediation or explicit human disposition.`
- `No merge-blocking technical risk found in the reviewed evidence.`

Never render `Approve`, `Request changes`, `Ready to merge`, or another human-owned verdict.