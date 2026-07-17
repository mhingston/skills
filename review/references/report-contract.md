# Report contract

## Contents

- [Finding schema](#finding-schema)
- [Severity](#severity)
- [Evidence rules](#evidence-rules)
- [Rendered report](#rendered-report)

## Finding schema

Require each lens to return this logical shape. JSON is preferred when the
harness preserves it reliably.

```json
{
  "lens": "correctness | security | spec | tests | design",
  "findings": [
    {
      "id": "COR-1",
      "severity": "blocker | major | minor",
      "file": "path/to/file",
      "line": "42 or 42-51",
      "title": "Concise, behavioural finding",
      "evidence": "Exact code or diff excerpt",
      "impact": "Failure, exposure, mismatch, regression, or maintenance cost",
      "suggested_fix": "Smallest concrete corrective direction",
      "verified": true
    }
  ],
  "strengths": [
    {
      "file": "path/to/file",
      "line": "12-20",
      "observation": "Concrete practice worth retaining"
    }
  ],
  "coverage": "What this lens inspected",
  "limitations": []
}
```

Use a lens-specific prefix: `COR`, `SEC`, `SPC`, `TST`, or `DSN`. Finding IDs
only need to be stable within the report; the synthesiser may renumber them
after deduplication.

## Severity

### Blocker

The change would ship an unacceptable, difficult-to-recover failure: exploitable
security breach, silent data corruption, broken documented flow, material
requirement reversal, or similarly consequential defect. A blocker must have a
concrete failure or attack path and direct evidence. Design taste is never a
blocker by itself.

### Major

The change is technically shippable but carries material correctness,
security, requirement, regression, or maintenance risk that should be resolved
before merge or explicitly tracked and accepted. Name the credible cost of
deferral.

### Minor

The issue is bounded and optional: a small robustness gap, focused missing edge
test, misleading name, local simplification, or maintainability improvement.
The author can reasonably address, defer, or reject it.

When between severities, choose the lower severity unless evidence establishes
the higher consequence. Review severity represents impact and likelihood, not
the reviewer's confidence or enthusiasm.

## Evidence rules

- Cite a verified repository-relative path and current line or tight range.
- Quote the smallest excerpt that proves the claim.
- Explain observable impact rather than naming a pattern alone.
- Separate confirmed findings from unverified suspicions.
- Put runtime-, production-, configuration-, or dependency-sensitive claims in
  `Unverified` unless the required evidence was inspected.
- Do not report formatting or lint issues enforced automatically by configured
  tooling unless that tooling is absent or demonstrably failing.
- Cap strengths at three. Every strength needs a path, line, and specific reason
  it is worth retaining.
- An empty result is valid. State coverage and limitations instead of inventing
  a finding.

## Rendered report

Use this order:

```markdown
# Review: <scope>

<merge recommendation and severity counts>

**Scope:** <working tree, revisions, PR, range, path, or module>
**Base / head:** <exact revisions, or not applicable>
**Execution:** <independent lens workers (parallel or batched) | single-context fallback | single-pass fast path>
**Spec source:** <source or none>
**Lenses:** <covered and skipped>

## Findings

| Severity | Lens | Location | Finding |
| --- | --- | --- | --- |

### [ID] Title

**Location:** `path:line`
**Evidence:** <quoted excerpt>
**Impact:** <concrete consequence>
**Suggested fix:** <direction, not an unsolicited patch>

## Unverified

- <suspicion, why unverified, and exact confirmation step>

## Strengths

- `path:line` — <specific evidenced practice>

## Coverage and limitations

- <what was inspected, unavailable, skipped, or not executed>
```

Omit empty `Unverified` and `Strengths` sections. Keep the summary and findings
table scannable. Do not hide a blocker beneath strengths or long methodology.
