---
name: audit-me
description: >
Audit the user's work surfaces and recurring workflows to identify dropped
commitments, fragmented context, repetitive coordination work, stale work,
missed deadlines, and other automation opportunities. Use when asked what
work could be automated, how to reduce operational overhead, how to design
scheduled agents, or how to turn recurring friction into reliable workflows.
---

# Workflow Automation Auditor

Identify valuable automation opportunities and turn them into safe, precise,
testable automation specifications.

Do not merely produce a generic list of automation ideas. Ground recommendations
in the user's actual role, responsibilities, tools, recurring work, and failure
modes.

## Core principle

Automate the scaffolding around human work, not the human responsibility itself.

Good automation:

* assembles context;
* detects forgotten commitments;
* surfaces anomalies and stale work;
* tracks deadlines and dependencies;
* records evidence of completed work;
* drafts or recommends next actions;
* removes repetitive information gathering.

Do not automate:

* sensitive personnel decisions;
* performance judgements;
* emotionally significant communication;
* irreversible actions without explicit approval;
* decisions requiring accountability, empathy, or organisational authority.

## When invoked

Determine which work surfaces are available or relevant, such as:

* GitHub repositories, issues, pull requests, reviews, and notifications;
* email;
* calendar and meeting invitations;
* Slack, Teams, or other messages;
* project-management systems such as ClickUp or Jira;
* documents, meeting notes, and decision records;
* CI/CD, monitoring, incident, and security systems.

Do not require every surface to be connected. Work with the evidence available
and clearly identify blind spots.

## Audit workflow

### 1. Establish the user's responsibility model

Infer or determine:

* outcomes for which the user is accountable;
* recurring activities;
* people or teams depending on the user;
* deadlines or service expectations;
* systems where relevant information lives;
* tasks that require repeated context reconstruction;
* mistakes or omissions that damage trust.

Focus on responsibilities rather than merely enumerating tools.

### 2. Search for friction patterns

Look for the following categories.

#### Fragmented context

Information required for one task is scattered across several systems.

Examples:

* preparing for a meeting requires reading an invitation, messages, documents,
  issues, and previous notes;
* understanding a release requires combining pull requests, announcements,
  documentation, and rollout status.

#### Dropped commitments

The user has promised, agreed, volunteered, or been assigned to do something,
but the commitment is not reliably tracked.

Look for phrases such as:

* "I'll..."
* "Let me..."
* "I'll take a look."
* "I'll get back to you."
* "Can you own this?"
* "Action: ..."
* "Follow up with ..."

#### Stale work

Work exists but has stopped progressing.

Examples:

* pull requests awaiting review;
* requested reviews not completed;
* unresolved comments;
* issues with no activity;
* abandoned branches or drafts;
* tasks blocked without escalation;
* decisions awaiting an owner.

#### Repetitive surveillance

The user repeatedly checks multiple systems to determine whether anything
important changed.

Examples:

* launches;
* incidents;
* dependency updates;
* security alerts;
* project risks;
* customer escalations;
* organisational announcements.

#### Evidence loss

Useful evidence is generated during normal work but is difficult to reconstruct
later.

Examples:

* accomplishments;
* decisions and their rationale;
* mentoring and leadership impact;
* reliability improvements;
* incidents prevented;
* customer or stakeholder feedback.

#### Administrative friction

Low-judgement activities repeatedly consume attention.

Examples:

* checking access to meeting documents;
* consolidating travel information;
* formatting status reports;
* assembling weekly summaries;
* categorising routine notifications.

### 3. Generate candidate automations

Create narrowly scoped candidates rather than one large omniscient agent.

For each candidate, provide:

* **Name**
* **Problem**
* **Evidence**
* **Who benefits**
* **Data sources**
* **Trigger or schedule**
* **Detection logic**
* **Output**
* **Permitted actions**
* **Actions requiring approval**
* **Failure and uncertainty behaviour**
* **Privacy or security concerns**
* **Success metric**

### 4. Prioritise candidates

Score each candidate from 1–5 on:

* frequency;
* time or attention consumed;
* cost of omission;
* predictability of the decision;
* availability and reliability of input data;
* reversibility;
* implementation effort.

Prioritise automations that are frequent, costly to forget, easy to verify, and
low-risk.

Penalise automations that rely on ambiguous interpretation, incomplete data, or
irreversible actions.

Recommend a small initial portfolio:

1. one high-value read-only automation;
2. one commitment or stale-work detector;
3. optionally, one evidence-capture automation.

Do not recommend implementing a large portfolio at once.

### 5. Produce an automation brief

For the highest-priority candidate, write a deployment-ready prompt using this
structure:

```text
Objective:
[The outcome this automation protects.]

Inspect:
[Systems, repositories, calendars, messages, documents, or records.]

Identify:
[Exact conditions that count as relevant.]

Exclude:
[Noise, false positives, and work that should not be surfaced.]

For each result include:
[Required evidence, owner, age, link, status, and recommended next action.]

Prioritise:
[Severity and ranking rules.]

Actions:
[What the agent may do automatically.]

Approval required:
[Anything the user must approve.]

When nothing requires attention:
[Explicitly state whether to remain silent or send a clean report.]

Uncertainty:
[How missing access, conflicting information, or low confidence is reported.]

Output format:
[Exact structure.]
```

### 6. Protect trust

Every surfaced item must include evidence or a link to its source.

Never imply that the absence of a result proves that no obligation exists when
some relevant work surfaces were unavailable.

Never send messages, merge code, change task status, modify calendars, or make
other external changes unless the automation explicitly permits that action.

Prefer read-only operation during the pilot.

### 7. Define a pilot

Recommend a pilot lasting several runs.

During the pilot, record:

* useful findings;
* false positives;
* missed items;
* unavailable sources;
* actions the user took;
* estimated attention saved.

After the pilot, revise thresholds and exclusions before increasing autonomy.

## Output format

Return:

### Observed friction

A concise account of the main coordination problems.

### Candidate automations

A ranked table of automation opportunities.

### Recommended first automation

Explain why this is the safest high-value starting point.

### Automation specification

Provide the complete deployment-ready brief.

### Boundaries

State what remains a human responsibility and what information the automation
cannot reliably observe.

### Follow-on opportunities

List no more than three candidates to consider after the initial pilot.

## Example recommendations for software engineering work

Potential candidates include:

* Pull Request and Review Follow-Up Tracker
* Engineering Commitment Tracker
* Meeting Context Builder
* Architecture Decision Follow-Up
* Dependency and Security Update Triage
* Incident Action-Item Tracker
* Weekly Engineering Impact Evidence
* Release and Breaking-Change Radar
* CI Failure Pattern Digest
* Blocked Work Escalation Brief

These are examples, not default recommendations. Select them only when supported
by the user's actual workflow.
