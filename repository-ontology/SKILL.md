---
name: repository-ontology
description: Evaluate, establish, validate, or evolve an ontology for a software repository. Use when asked to identify repository or domain concepts, create a shared vocabulary, model architectural or business relationships, assess an existing ontology, improve semantic grounding for agents, or determine whether a repository would benefit from an ontology or knowledge graph.
compatibility: Requires read access to relevant repository evidence. Formal RDF, OWL, SHACL, or reasoner validation also requires suitable ontology tooling.
---

# Repository Ontology

Establish the smallest evidence-backed semantic model that helps a named consumer
answer concrete questions or control behaviour. Do not create an ontology merely
to document every file, class, table, or dependency.

## Modes

- **Assess** — determine whether existing semantic assets are sufficient.
- **Establish** — create an initial glossary, taxonomy, typed model, graph, or
  formal ontology.
- **Evolve** — propose controlled changes to an existing model.

Always assess before establishing or evolving.

## Core principles

### Prefer the minimum sufficient model

Choose the least expressive representation that answers the competency questions:

1. glossary for consistent terminology;
2. taxonomy for categorisation and broader/narrower relationships;
3. typed concept model for explicit entities, relationships, and constraints;
4. RDF or JSON-LD graph for global identifiers, graph queries, or interoperability;
5. OWL for formal semantics and inference;
6. SHACL or equivalent for validating operational graph data.

Do not select a formalism because it appears sophisticated.

### Ground every material assertion

A repository identifier is not automatically a domain concept. Do not infer
canonical meaning from filenames, class names, database tables, routes, comments,
directory layout, generated documentation, or one isolated implementation.

Prefer maintained authoritative sources and multiple independent evidence types.
Treat ambiguous interpretations as hypotheses requiring review.

### Keep semantic layers distinct

Classify concepts as one or more of:

- domain;
- architecture;
- implementation;
- delivery;
- governance;
- agent operation.

Do not collapse a domain concept into its current class, table, service, or file.

### Preserve provenance and uncertainty

For each material assertion record source, repository location, revision when
relevant, evidence type, confidence, status, and reviewer when confirmed.

Use these statuses precisely:

- `observed` — directly present in evidence;
- `inferred` — reasoned from observations;
- `confirmed` — accepted by an authorised human or authoritative source;
- `disputed` — conflicting meanings or evidence exist;
- `deprecated` — retained for compatibility but no longer preferred.

Never present an inferred assertion as confirmed.

## Evidence inputs

Use relevant maintained evidence such as:

- README, contributor, architecture, domain, and decision documentation;
- glossaries, taxonomies, diagrams, and existing ontology assets;
- public types, interfaces, APIs, messages, events, and schemas;
- database schemas and migrations;
- tests, fixtures, and acceptance scenarios;
- configuration, deployment, package, ownership, and governance files;
- version-control, issue, and pull-request history when materially useful.

Treat generated, duplicated, and historical sources as lower authority unless the
repository explicitly designates them as canonical.

## Core workflow

### 1. Establish purpose and ownership

Identify:

- the decision, workflow, retrieval task, validation, or agent behaviour the model
  must support;
- the human or software consumer;
- the maintainer and update trigger;
- success criteria and acceptable maintenance cost.

Examples include mapping capabilities to code, tracing requirements to tests,
identifying event relationships, routing agents, validating action preconditions,
or preserving canonical vocabulary.

If no concrete consumer or use case exists, recommend against a formal ontology.

### 2. Inventory existing semantic assets

Search for existing glossaries, schemas, type systems, domain models, architecture
models, metadata vocabularies, knowledge graphs, policy definitions, and generated
documentation.

Determine whether the repository already has a sufficient implicit or distributed
model. The absence of RDF or OWL does not mean no ontology exists; a dependency
graph alone is not an ontology.

### 3. Define competency questions

Write bounded questions the model must answer. For each question record:

- intended consumer;
- why the answer matters;
- required concepts and relationships;
- example answer;
- expected supporting evidence;
- acceptance test.

Reject questions too broad to test. Prefer questions such as:

- Which service implements this business capability?
- Which events can change this aggregate's state?
- Which tests validate this requirement or invariant?
- Which source is authoritative for this concept?
- Which action may an agent perform on this artefact, under what preconditions?
- Which assertions are confirmed, inferred, disputed, or stale?

### 4. Decide whether an ontology is warranted

Return one verdict:

- `not-needed`;
- `glossary-sufficient`;
- `taxonomy-sufficient`;
- `typed-concept-model`;
- `semantic-graph`;
- `formal-ontology`;
- `operational-ontology`.

Base the verdict on competency questions and consumers, not repository size or
novelty. Explain why simpler alternatives such as documentation, JSON Schema,
OpenAPI, static analysis, or a dependency graph are or are not sufficient.

### 5. Build an evidence-backed term inventory

For each candidate term record:

- identifier and preferred label;
- discriminating definition;
- semantic layer;
- status, confidence, and provenance;
- synonyms, homonyms, deprecated terms, and conflicts;
- examples and counterexamples;
- implementation-specific names that must not become canonical terminology.

Avoid circular definitions. Resolve terminology conflicts only when authoritative
evidence supports the choice; otherwise preserve the disagreement.

### 6. Construct the minimum conceptual model

Model only concepts and relationships required by the competency questions.

For each concept define identity criteria, lifecycle or state when relevant,
required and optional properties, broader concept, provenance requirements,
examples, and counterexamples.

For each relationship define source, target, direction, meaning, justified
cardinality, temporal characteristics, evidence, examples, and counterexamples.
Prefer precise relationships such as `implements`, `owns`, `publishes`,
`consumes`, `dependsOn`, `validates`, `governedBy`, `authorisedBy`,
`derivedFrom`, and `supersedes`. Avoid vague `relatedTo` edges.

When the verdict requires RDF, JSON-LD, OWL, SHACL, formal axioms, or operational
agent constraints, read
[`references/formal-modeling.md`](references/formal-modeling.md) before
formalisation.

### 7. Validate usefulness and correctness

Test every competency question against the proposed model. Check:

- coverage — required concepts and relations exist;
- answerability — the model can produce the expected answer;
- evidence — answers trace to repository sources;
- ambiguity — conflicting meanings remain visible;
- consistency — identifiers and constraints do not contradict each other;
- minimality — removing an element would break a competency question;
- maintenance — ownership and refresh triggers are explicit;
- agent safety — permissions, evidence, and mutable policy are not confused with
  domain truth.

For formal models, run parser, schema, constraint, and reasoner checks appropriate
to the chosen language. Report unavailable tooling rather than claiming formal
validation.

### 8. Review with domain and operational owners

Ask authorised reviewers to confirm definitions, disputed terms, authority,
constraints, and maintenance ownership. Record decisions and rejected
alternatives. Human confirmation changes status; model confidence does not.

### 9. Publish incrementally

Prefer a small versioned model plus provenance over a large speculative graph.
For large repositories, partition by competency question, domain boundary, or
semantic layer; reconcile identifiers and conflicts before adding cross-boundary
relationships.

Keep schema, instances, validation constraints, and mutable policy in distinct
artefacts or clearly separated sections.

## Output contract

Return:

1. purpose, consumer, maintainer, and evidence scope;
2. competency questions and acceptance tests;
3. verdict and rejected simpler or more complex alternatives;
4. evidence-backed term inventory and unresolved conflicts;
5. minimum conceptual model;
6. provenance and confidence register;
7. validation results and limitations;
8. maintenance and review plan;
9. recommended next increment or `no further formalisation`.

Read
[`references/output-contracts.md`](references/output-contracts.md) when producing
machine-readable inventories, concept models, formalisation proposals, or audit
reports.

## Failure and stop conditions

Stop or downgrade the verdict when:

- no concrete consumer or competency questions can be established;
- repository evidence is insufficient or contradictory;
- a simpler maintained artefact already answers the questions;
- no owner can review or maintain the model;
- formal validation is required but unavailable;
- proposed semantics would encode mutable policy as timeless domain truth;
- the model cannot answer its own acceptance tests.

Report the missing evidence or decision and the smallest recovery action. Do not
fill gaps with plausible terminology or generated axioms.
