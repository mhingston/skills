# Review calibration contract

## Principle

Calibration proposes bounded, evidence-backed policy experiments. It never changes policy
or converts historical correlations into approval rules.

## Minimum evidence ledger

Use one review-level record per exact head revision:

```json
{
  "repository": "owner/repository",
  "head_sha": "40-character SHA",
  "review_schema_version": 2,
  "reviewed_at": "RFC-3339 timestamp",
  "consequence_risk": "moderate",
  "comprehension_risk": "high",
  "dimensions": ["correctness", "security"],
  "reviewer_provenance": {
    "execution_mode": "parallel-independent-contexts",
    "models": ["model identifier when available"],
    "shared_prompt_family": true,
    "shared_evidence_packet": true,
    "independent_falsifier": true,
    "correlation_limitations": ["same model family"]
  },
  "calibration_receipt": {
    "candidate_findings": 8,
    "validated_findings": 3,
    "falsified_findings": 4,
    "inconclusive_findings": 1,
    "deduplicated_findings": 1,
    "measured_latency_seconds": null,
    "measured_cost": null
  },
  "risk_ids": ["RISK-1"],
  "design_redirect_ids": [],
  "verdict_record": "reference or null",
  "later_outcomes": []
}
```

Use `null` or omit optional measured fields when unavailable. Never estimate model cost,
latency, candidate counts, or outcome linkage merely to complete the structure.

Use one risk-level record when analysing thresholds and human dispositions:

```json
{
  "repository": "owner/repository",
  "head_sha": "40-character SHA",
  "risk_id": "RISK-1",
  "dimension": "data integrity and migration safety",
  "severity": "major",
  "likelihood": "medium",
  "confidence": "high",
  "policy_threshold": "major",
  "threshold_result": "exceeded",
  "technical_disposition": "remediate-before-merge",
  "human_disposition": "remediated",
  "human_rationale_category": "confirmed failure path",
  "specialist_review": null,
  "later_outcome": null,
  "outcome_linkage_confidence": "not-applicable"
}
```

Do not copy private human rationale into a broad calibration dataset when a bounded
category is sufficient.

## Metric definitions

### Candidate validation rate

`validated_findings / candidate_findings`

Use only when candidate collection was recorded consistently. A higher value is not
necessarily better: it may indicate weak falsification or conservative candidate creation.

### Falsification yield

`falsified_findings / candidate_findings`

Interpret with the evidence checked and candidate-generation policy. High yield may mean
valuable suppression or noisy originating passes.

### Unique dimension contribution

Count validated risk root causes attributable to a dimension that were not independently
recovered by another dimension or deterministic check. Do not count duplicate wording as
unique contribution.

### Human rejection pattern

Count risks disposed as `rejected-as-unsupported`, grouped by evidence failure, policy
mismatch, duplicate root cause, missing context, or other stated rationale. Do not assume
the human was correct without checking later evidence.

### Escape alignment

A later defect aligns to a review gap only when:

1. the exact shipped or reviewed revision is known;
2. the causal mechanism is established;
3. the relevant evidence was within review scope or reasonably obtainable;
4. the defect maps to a missing, ineffective, or unresolved review question.

Label weaker associations `temporal-only` or `plausible`, not confirmed.

### Marginal worker value

A worker, model, specialist, or tool contributes marginal value when removing its unique
validated evidence would materially change the final risk map, specialist routing,
design redirect, or named unknown. Restated findings do not count.

### Cost and latency

Use measured values only. Compare them within equivalent consequence-risk cohorts and
workflow versions. Do not trade away required safety evidence solely to reduce averages.

## Proposal schema

Every proposal uses this shape:

```json
{
  "proposal_id": "CAL-1",
  "title": "Test heterogeneous falsification for high-consequence changes",
  "evidence": {
    "cohort": "24 high-consequence reviews",
    "observations": ["..."],
    "limitations": ["..."]
  },
  "interpretation": "Calibrated explanation",
  "alternatives": ["Another plausible explanation"],
  "change": {
    "policy_surface": "reviewer topology",
    "current": "same model family",
    "proposed": "different model family for falsification only",
    "scope": "high-consequence changes touching trust or persistence boundaries"
  },
  "expected_benefit": "More assumption diversity during finding challenge",
  "possible_harms": ["latency", "inconsistent tool access"],
  "evaluation": {
    "cohort_or_sample_target": "next 20 eligible reviews",
    "success_measures": ["unique invalidations", "changed risk-map outcomes"],
    "harm_measures": ["added latency", "unsupported contradictions"],
    "rollback_condition": "No material marginal value after target cohort"
  },
  "authority_required": "Named policy owner",
  "status": "proposed"
}
```

Allowed `status` values are `proposed`, `approved-for-experiment`, `rejected`, and
`adopted`. The calibration skill emits only `proposed` unless it is faithfully recording
an explicit human decision.

## Reporting rules

- Show counts and denominators together.
- State schema and workflow versions for every cohort.
- Separate confirmed outcome links from plausible or temporal associations.
- Include no-change conclusions where evidence supports the current mechanism.
- Name missing instrumentation instead of filling gaps with model judgement.
- Keep proposals reversible, scoped, measurable, and human-owned.