<!-- human-verdict-record:v2
{
  "schemaVersion": "2.0",
  "repository": "OWNER/REPOSITORY",
  "pullRequestNumber": 123,
  "headSha": "0000000000000000000000000000000000000000",
  "recordedAt": "2026-07-20T12:00:00Z",
  "accountableOwner": "human identity supplied by the user",
  "verdict": "approve-with-conditions",
  "humanExplanation": "verbatim or faithfully structured human-provided explanation",
  "mostCredibleFailureMode": "human-provided failure mode",
  "detection": "human-provided detection method",
  "containmentOrRollback": "human-provided containment or rollback",
  "evidenceReliedUpon": ["specific evidence"],
  "evidenceLimitations": ["what the evidence does not establish"],
  "riskMapRef": "path or URL to the revision-bound risk map",
  "riskDispositions": [
    {
      "riskId": "RISK-1",
      "disposition": "accepted-with-conditions",
      "rationale": "human-provided risk-specific rationale",
      "conditions": [
        {
          "description": "Monitor the new failure signal during staged rollout",
          "status": "open"
        }
      ],
      "owner": "human-supplied owner",
      "reviewPoint": "human-supplied review point",
      "evidence": ["risk-specific evidence selected by the human"]
    }
  ],
  "residualRisk": "risk explicitly accepted or identified by the human",
  "rationale": "human-provided decision rationale",
  "conditions": [],
  "reviewOrExpiryPoint": null,
  "specialistApprovals": [],
  "sourcePacket": null,
  "technicalReviewRef": null
}
-->

## Human verdict: APPROVE WITH CONDITIONS

**Applies to PR head:** `0000000000000000000000000000000000000000`  
**Accountable owner:** human identity  
**Recorded:** 2026-07-20T12:00:00Z  
**Risk map:** path or URL to the revision-bound risk map

### Human explanation

Human-provided explanation of the behavioural change and important trade-off.

### Risk ownership

- **Most credible failure mode:** Human-provided answer.
- **Detection:** Human-provided answer.
- **Containment or rollback:** Human-provided answer.
- **Residual risk:** Human-provided answer.

### Material risk dispositions

| Risk | Human disposition | Rationale | Conditions / owner / review point |
| --- | --- | --- | --- |
| `RISK-1` | Accepted with conditions | Human-provided risk-specific rationale | Monitor staged rollout · owner: human-supplied owner · review: human-supplied review point |

### Evidence assessment

**Evidence relied upon**

- Specific evidence selected by the human.

**Evidence limitations**

- What the evidence does not establish.

### Rationale

Human-provided rationale.

### Conditions

- Open — Monitor the new failure signal during staged rollout.

> This verdict and every recorded risk disposition are revision-specific. They
> become stale when the PR head SHA changes and must not be treated as merge or
> deployment authorisation on their own.