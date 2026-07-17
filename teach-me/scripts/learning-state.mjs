#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCHEMA = 1;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GRADES = new Set(["recalled", "partial", "lapsed"]);
const KINDS = new Set(["pretest", "encode", "review", "transfer"]);
const MILESTONE_KINDS = new Set([
  "demonstrated-understanding",
  "prior-knowledge",
  "corrected-misconception",
  "mission-shift",
]);
const RECEIPT_BACKED_MILESTONES = new Set([
  "demonstrated-understanding",
  "corrected-misconception",
]);
const REFERENCE_AUTHORSHIP = new Set(["learner", "learner-edited"]);
const INTERVAL_DAYS = [1, 3, 7, 14, 30, 60, 120];
const DEFAULT_PROFILE = {
  schema: SCHEMA,
  interests: [],
  preferences: {
    default_mode: "standard",
    artifact_policy: "threshold",
  },
  commitment: null,
};

class StateError extends Error {}

function clone(value) {
  return structuredClone(value);
}

function expandHome(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith(`~${path.sep}`) || value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

function stateRoot() {
  const override = process.env.TEACH_ME_HOME;
  return override
    ? path.resolve(expandHome(override))
    : path.join(os.homedir(), ".teach-me");
}

function validDateText(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function today() {
  const frozen = process.env.TEACH_ME_TODAY;
  if (frozen) {
    if (!validDateText(frozen)) throw new StateError("TEACH_ME_TODAY must use YYYY-MM-DD");
    return frozen;
  }
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  const frozen = process.env.TEACH_ME_TODAY;
  if (frozen) {
    const date = today();
    return `${date}T12:00:00.000Z`;
  }
  return new Date().toISOString();
}

function addDays(dateText, days) {
  if (!validDateText(dateText)) throw new StateError(`invalid date: ${dateText}`);
  const value = new Date(`${dateText}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function timestampDate(value) {
  if (typeof value !== "string") throw new StateError("receipt recorded_at must be an ISO timestamp");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new StateError(`invalid receipt timestamp: ${value}`);
  return parsed.toISOString().slice(0, 10);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function readJson(inputPath) {
  let text;
  try {
    text = inputPath === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(inputPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") throw new StateError(`input file does not exist: ${inputPath}`);
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new StateError(`invalid JSON in ${inputPath === "-" ? "stdin" : inputPath}: ${error.message}`);
  }
}

function loadJson(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) return clone(defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new StateError(`corrupt JSON in ${filePath}: ${error.message}`);
  }
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, filePath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function sleep(milliseconds) {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, milliseconds);
}

function withStateLock(root, operation) {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const lockPath = path.join(root, ".lockdir");
  let acquired = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      fs.mkdirSync(lockPath);
      acquired = true;
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        const age = Date.now() - fs.statSync(lockPath).mtimeMs;
        if (age > 30_000) {
          fs.rmdirSync(lockPath);
          continue;
        }
      } catch (statError) {
        if (statError?.code !== "ENOENT") throw statError;
      }
      sleep(50);
    }
  }
  if (!acquired) throw new StateError(`learning state is locked: ${root}`);
  try {
    return operation();
  } finally {
    try {
      fs.rmdirSync(lockPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function initialize(root) {
  fs.mkdirSync(path.join(root, "topics"), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, "receipts"), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, "milestones"), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, "references"), { recursive: true, mode: 0o700 });
  const profilePath = path.join(root, "learner.json");
  const pendingPath = path.join(root, "pending.json");
  if (!fs.existsSync(profilePath)) atomicWriteJson(profilePath, DEFAULT_PROFILE);
  if (!fs.existsSync(pendingPath)) atomicWriteJson(pendingPath, []);
}

function requireSlug(value, label) {
  if (typeof value !== "string" || !SLUG_RE.test(value)) {
    throw new StateError(`${label} must be lowercase kebab-case`);
  }
  return value;
}

function requireText(value, label, { allowEmpty = false } = {}) {
  if (typeof value !== "string") throw new StateError(`${label} must be a string`);
  const result = value.trim();
  if (!allowEmpty && !result) throw new StateError(`${label} must not be empty`);
  return result;
}

function validateConfidence(value) {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new StateError("confidence must be an integer from 0 to 100 or null");
  }
  return value;
}

function validateStringList(value, label, { minItems = 0 } = {}) {
  if (!Array.isArray(value)) throw new StateError(`${label} must be an array`);
  const result = value.map((item) => requireText(item, `${label} item`));
  if (result.length < minItems) {
    throw new StateError(`${label} must contain at least ${minItems} item(s)`);
  }
  return result;
}

function validateMission(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StateError("mission must be an object or null");
  }
  return {
    why: requireText(value.why, "mission.why"),
    success: validateStringList(value.success, "mission.success", { minItems: 1 }),
    constraints: validateStringList(value.constraints ?? [], "mission.constraints"),
    out_of_scope: validateStringList(value.out_of_scope ?? [], "mission.out_of_scope"),
  };
}

function validateSources(value) {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new StateError("sources must be an array");
  return value.map((source, index) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new StateError(`sources[${index}] must be an object`);
    }
    return {
      title: requireText(source.title, `sources[${index}].title`),
      location: requireText(source.location, `sources[${index}].location`),
      use_for: requireText(source.use_for, `sources[${index}].use_for`),
    };
  });
}

function emptyNodeState() {
  return {
    status: "new",
    stage: 0,
    due: null,
    attempts: 0,
    review_attempts: 0,
    lapses: 0,
    last_grade: null,
    last_receipt: null,
    last_receipt_at: null,
    transfer: { attempts: 0, owned: false, last_grade: null },
    mastered: false,
  };
}

function effectiveReceiptGrade(receipt) {
  return receipt.source === "told" ? "partial" : receipt.grade;
}

function isRecallEvidence(receipt) {
  return effectiveReceiptGrade(receipt) === "recalled";
}

function validateTopicPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StateError("topic input must be a JSON object");
  }
  const topic = requireSlug(payload.topic, "topic");
  const title = requireText(payload.title ?? topic.replaceAll("-", " "), "title");
  const goal = requireText(payload.goal, "goal");
  const mission = validateMission(payload.mission ?? null);
  const sources = validateSources(payload.sources ?? []);
  const sourceGaps = validateStringList(payload.source_gaps ?? [], "source_gaps");
  if (!Array.isArray(payload.order) || payload.order.length === 0) {
    throw new StateError("order must be a non-empty array");
  }
  const order = payload.order.map((item) => requireSlug(item, "node id in order"));
  if (new Set(order).size !== order.length) throw new StateError("order contains duplicate node ids");
  if (!payload.nodes || typeof payload.nodes !== "object" || Array.isArray(payload.nodes)) {
    throw new StateError("nodes must be an object");
  }
  const nodeKeys = Object.keys(payload.nodes).sort();
  const orderKeys = [...order].sort();
  if (JSON.stringify(nodeKeys) !== JSON.stringify(orderKeys)) {
    throw new StateError("nodes must contain exactly the ids listed in order");
  }

  const positions = new Map(order.map((nodeId, index) => [nodeId, index]));
  const nodes = {};
  for (const nodeId of order) {
    const raw = payload.nodes[nodeId];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new StateError(`node ${nodeId} must be an object`);
    }
    if (!Array.isArray(raw.requires ?? [])) {
      throw new StateError(`node ${nodeId}.requires must be an array`);
    }
    const requires = (raw.requires ?? []).map((item) =>
      requireSlug(item, `node ${nodeId} prerequisite`),
    );
    if (new Set(requires).size !== requires.length) {
      throw new StateError(`node ${nodeId} has duplicate prerequisites`);
    }
    for (const prerequisite of requires) {
      if (!positions.has(prerequisite)) {
        throw new StateError(`node ${nodeId} requires unknown node ${prerequisite}`);
      }
      if (positions.get(prerequisite) >= positions.get(nodeId)) {
        throw new StateError(
          `node ${nodeId} prerequisite ${prerequisite} must appear earlier in order`,
        );
      }
    }
    let transferProbe = raw.transfer_probe ?? null;
    if (transferProbe !== null) {
      transferProbe = requireText(transferProbe, `node ${nodeId}.transfer_probe`);
    }
    const arbitrary = raw.arbitrary ?? false;
    const threshold = raw.threshold ?? false;
    if (typeof arbitrary !== "boolean" || typeof threshold !== "boolean") {
      throw new StateError(`node ${nodeId} arbitrary and threshold must be booleans`);
    }
    nodes[nodeId] = {
      claim: requireText(raw.claim, `node ${nodeId}.claim`),
      probe: requireText(raw.probe, `node ${nodeId}.probe`),
      rubric: validateStringList(raw.rubric, `node ${nodeId}.rubric`, { minItems: 1 }),
      requires,
      transfer_probe: transferProbe,
      arbitrary,
      threshold,
      state: emptyNodeState(),
    };
  }
  return {
    schema: SCHEMA,
    topic,
    title,
    goal,
    mission,
    sources,
    source_gaps: sourceGaps,
    created_at: payload.created_at ?? nowIso(),
    order,
    nodes,
  };
}

function topicPath(root, topic) {
  return path.join(root, "topics", `${topic}.json`);
}

function receiptPath(root, topic) {
  return path.join(root, "receipts", `${topic}.jsonl`);
}

function milestonePath(root, topic) {
  return path.join(root, "milestones", `${topic}.jsonl`);
}

function referencePath(root, topic, reference) {
  return path.join(root, "references", topic, `${reference}.json`);
}

function loadJsonLines(filePath, label) {
  if (!fs.existsSync(filePath)) return [];
  const items = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      const item = JSON.parse(line);
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`${label} must be an object`);
      }
      items.push(item);
    } catch (error) {
      throw new StateError(`invalid ${label} in ${filePath}:${index + 1}: ${error.message}`);
    }
  });
  return items;
}

function loadReceipts(root, topic) {
  return loadJsonLines(receiptPath(root, topic), "receipt");
}

function loadMilestones(root, topic) {
  return loadJsonLines(milestonePath(root, topic), "milestone");
}

function rebuildTopic(topic, receipts) {
  const rebuilt = clone(topic);
  for (const node of Object.values(rebuilt.nodes)) node.state = emptyNodeState();

  for (const receipt of receipts) {
    const nodeId = receipt.node;
    if (receipt.topic !== rebuilt.topic || !rebuilt.nodes[nodeId]) {
      throw new StateError(
        `receipt ${receipt.receipt_id ?? "<unknown>"} references an unknown topic or node`,
      );
    }
    if (!GRADES.has(receipt.grade) || !KINDS.has(receipt.kind)) {
      throw new StateError(`receipt ${receipt.receipt_id ?? "<unknown>"} has invalid grade or kind`);
    }
    const state = rebuilt.nodes[nodeId].state;
    const recorded = timestampDate(receipt.recorded_at);
    state.last_receipt = receipt.receipt_id ?? null;
    state.last_receipt_at = receipt.recorded_at;

    if (receipt.kind === "transfer") {
      state.transfer.attempts += 1;
      state.transfer.last_grade = receipt.grade;
      state.transfer.owned = receipt.grade === "recalled";
      continue;
    }

    state.attempts += 1;
    if (receipt.kind === "review") state.review_attempts += 1;
    const effectiveGrade = effectiveReceiptGrade(receipt);
    state.last_grade = effectiveGrade;
    if (effectiveGrade === "recalled") {
      state.stage = Math.min(state.stage + 1, INTERVAL_DAYS.length);
      state.due = addDays(recorded, INTERVAL_DAYS[state.stage - 1]);
    } else if (effectiveGrade === "partial") {
      state.stage = Math.max(0, state.stage - 1);
      state.due = addDays(recorded, 1);
    } else {
      state.stage = Math.max(0, state.stage - 2);
      state.lapses += 1;
      state.due = addDays(recorded, 1);
    }
  }

  for (const node of Object.values(rebuilt.nodes)) {
    const { state } = node;
    if (state.attempts === 0) state.status = "new";
    else if (state.last_grade !== "recalled" || state.stage < 2) state.status = "learning";
    else if (state.stage >= 4) state.status = "durable";
    else state.status = "review";
    const transferMet = !node.transfer_probe || state.transfer.owned;
    state.mastered = state.status === "durable" && transferMet;
  }
  return rebuilt;
}

function loadTopic(root, topic, { persistRebuild = true } = {}) {
  requireSlug(topic, "topic");
  const filePath = topicPath(root, topic);
  if (!fs.existsSync(filePath)) throw new StateError(`unknown topic: ${topic}`);
  const raw = loadJson(filePath, {});
  const rebuilt = rebuildTopic(raw, loadReceipts(root, topic));
  if (persistRebuild && JSON.stringify(rebuilt) !== JSON.stringify(raw)) {
    atomicWriteJson(filePath, rebuilt);
  }
  return rebuilt;
}

function listTopicSlugs(root) {
  const directory = path.join(root, "topics");
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -5))
    .sort();
}

function appendReceipt(root, receipt) {
  appendJsonLine(receiptPath(root, receipt.topic), receipt);
}

function appendJsonLine(filePath, item) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const descriptor = fs.openSync(filePath, "a", 0o600);
  try {
    fs.writeSync(descriptor, `${JSON.stringify(item)}\n`, undefined, "utf8");
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function allReceiptIds(root) {
  const ids = new Set();
  for (const topic of listTopicSlugs(root)) {
    for (const receipt of loadReceipts(root, topic)) {
      if (typeof receipt.receipt_id === "string") ids.add(receipt.receipt_id);
    }
  }
  return ids;
}

function findReceipt(root, receiptId) {
  for (const topic of listTopicSlugs(root)) {
    for (const receipt of loadReceipts(root, topic)) {
      if (receipt.receipt_id === receiptId) return receipt;
    }
  }
  return null;
}

function receiptsById(root, topic) {
  return new Map(loadReceipts(root, topic).map((receipt) => [receipt.receipt_id, receipt]));
}

function validateReceiptLinks(root, topic, value, label, { required = false } = {}) {
  const receiptIds = validateStringList(value ?? [], label, { minItems: required ? 1 : 0 });
  if (new Set(receiptIds).size !== receiptIds.length) {
    throw new StateError(`${label} contains duplicate receipt ids`);
  }
  const receipts = receiptsById(root, topic);
  const unknown = receiptIds.filter((receiptId) => !receipts.has(receiptId));
  if (unknown.length) {
    throw new StateError(`${label} references unknown receipt(s): ${unknown.join(", ")}`);
  }
  return { receiptIds, receipts };
}

function milestoneRows(root, topicFilter = null) {
  const topics = topicFilter ? [requireSlug(topicFilter, "topic")] : listTopicSlugs(root);
  const rows = [];
  for (const topic of topics) {
    if (topicFilter) loadTopic(root, topic);
    const items = loadMilestones(root, topic);
    const supersededBy = new Map();
    for (const item of items) {
      for (const priorId of item.supersedes ?? []) supersededBy.set(priorId, item.milestone_id);
    }
    rows.push(
      ...items.map((item) => ({
        ...item,
        status: supersededBy.has(item.milestone_id) ? "superseded" : "active",
        superseded_by: supersededBy.get(item.milestone_id) ?? null,
      })),
    );
  }
  return rows.sort((left, right) =>
    [left.recorded_at, left.topic, left.milestone_id].join("\0").localeCompare(
      [right.recorded_at, right.topic, right.milestone_id].join("\0"),
    ),
  );
}

function commandMilestoneAdd(root, inputPath) {
  const payload = readJson(inputPath);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StateError("milestone input must be a JSON object");
  }
  const milestoneId = requireText(payload.milestone_id, "milestone_id");
  const topic = requireSlug(payload.topic, "topic");
  loadTopic(root, topic);
  if (!MILESTONE_KINDS.has(payload.kind)) {
    throw new StateError(`kind must be one of: ${[...MILESTONE_KINDS].sort().join(", ")}`);
  }
  const needsReceipts = RECEIPT_BACKED_MILESTONES.has(payload.kind);
  const { receiptIds, receipts } = validateReceiptLinks(
    root,
    topic,
    payload.receipt_ids,
    "receipt_ids",
    { required: needsReceipts },
  );
  if (needsReceipts && !receiptIds.some((receiptId) => isRecallEvidence(receipts.get(receiptId)))) {
    throw new StateError(`${payload.kind} requires at least one recalled receipt`);
  }
  const supersedes = validateStringList(payload.supersedes ?? [], "supersedes");
  if (new Set(supersedes).size !== supersedes.length) {
    throw new StateError("supersedes contains duplicate milestone ids");
  }
  const existing = loadMilestones(root, topic);
  const existingById = new Map(existing.map((item) => [item.milestone_id, item]));
  const item = {
    schema: SCHEMA,
    milestone_id: milestoneId,
    recorded_at: payload.recorded_at ?? nowIso(),
    topic,
    kind: payload.kind,
    summary: requireText(payload.summary, "summary"),
    evidence: requireText(payload.evidence, "evidence"),
    receipt_ids: receiptIds,
    implications: validateStringList(payload.implications ?? [], "implications"),
    supersedes,
  };
  const duplicate = milestoneRows(root).find((row) => row.milestone_id === milestoneId);
  if (duplicate) {
    const stableFields = Object.keys(item).filter((field) => field !== "recorded_at");
    if (stableFields.some((field) => JSON.stringify(duplicate[field]) !== JSON.stringify(item[field]))) {
      throw new StateError(`milestone_id collision with different content: ${milestoneId}`);
    }
    return { applied: false, milestone_id: milestoneId, reason: "duplicate" };
  }
  const unknownSuperseded = supersedes.filter((priorId) => !existingById.has(priorId));
  if (unknownSuperseded.length) {
    throw new StateError(`supersedes references unknown milestone(s): ${unknownSuperseded.join(", ")}`);
  }
  const alreadySuperseded = new Set(existing.flatMap((prior) => prior.supersedes ?? []));
  const inactiveTargets = supersedes.filter((priorId) => alreadySuperseded.has(priorId));
  if (inactiveTargets.length) {
    throw new StateError(`cannot supersede inactive milestone(s): ${inactiveTargets.join(", ")}`);
  }
  appendJsonLine(milestonePath(root, topic), item);
  return { applied: true, milestone_id: milestoneId };
}

function commandMilestone(root, action, inputPath, topic) {
  if (action === "add") {
    if (!inputPath) throw new StateError("milestone add requires --file");
    return commandMilestoneAdd(root, inputPath);
  }
  if (action === "list") {
    const items = milestoneRows(root, topic);
    return { items, count: items.length, active: items.filter((item) => item.status === "active").length };
  }
  throw new StateError(`unknown milestone action: ${action}`);
}

function listReferenceSlugs(root, topic) {
  const directory = path.join(root, "references", topic);
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -5))
    .sort();
}

function loadReference(root, topic, reference) {
  requireSlug(topic, "topic");
  requireSlug(reference, "reference");
  const filePath = referencePath(root, topic, reference);
  if (!fs.existsSync(filePath)) throw new StateError(`unknown reference: ${topic}/${reference}`);
  const item = loadJson(filePath, {});
  if (item.topic !== topic || item.reference !== reference) {
    throw new StateError(`reference identity mismatch: ${topic}/${reference}`);
  }
  return item;
}

function commandReferenceAdd(root, inputPath, replace) {
  const payload = readJson(inputPath);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StateError("reference input must be a JSON object");
  }
  const topic = requireSlug(payload.topic, "topic");
  const reference = requireSlug(payload.reference, "reference");
  loadTopic(root, topic);
  if (!REFERENCE_AUTHORSHIP.has(payload.authorship)) {
    throw new StateError(
      `authorship must be one of: ${[...REFERENCE_AUTHORSHIP].sort().join(", ")}`,
    );
  }
  const { receiptIds, receipts } = validateReceiptLinks(
    root,
    topic,
    payload.receipt_ids,
    "receipt_ids",
    { required: true },
  );
  if (!receiptIds.some((receiptId) => isRecallEvidence(receipts.get(receiptId)))) {
    throw new StateError("a reference requires at least one recalled receipt");
  }
  const filePath = referencePath(root, topic, reference);
  const existing = fs.existsSync(filePath) ? loadReference(root, topic, reference) : null;
  const item = {
    schema: SCHEMA,
    topic,
    reference,
    title: requireText(payload.title, "title"),
    content: requireText(payload.content, "content"),
    authorship: payload.authorship,
    receipt_ids: receiptIds,
    created_at: existing?.created_at ?? payload.created_at ?? nowIso(),
    updated_at: nowIso(),
  };
  if (existing && !replace) {
    const stableFields = Object.keys(item).filter((field) => field !== "updated_at");
    if (stableFields.every((field) => JSON.stringify(existing[field]) === JSON.stringify(item[field]))) {
      return { applied: false, topic, reference, reason: "duplicate" };
    }
    throw new StateError(`reference already exists: ${topic}/${reference} (use --replace to revise it)`);
  }
  atomicWriteJson(filePath, item);
  return { applied: true, topic, reference, revised: Boolean(existing) };
}

function commandReference(root, action, inputPath, topic, reference, replace) {
  if (action === "add") {
    if (!inputPath) throw new StateError("reference add requires --file");
    return commandReferenceAdd(root, inputPath, replace);
  }
  if (action === "show") {
    if (!topic || !reference) throw new StateError("reference show requires --topic and --reference");
    return loadReference(root, topic, reference);
  }
  if (action === "list") {
    const topics = topic ? [requireSlug(topic, "topic")] : listTopicSlugs(root);
    const items = [];
    for (const topicSlug of topics) {
      if (topic) loadTopic(root, topicSlug);
      for (const referenceSlug of listReferenceSlugs(root, topicSlug)) {
        const item = loadReference(root, topicSlug, referenceSlug);
        items.push({
          topic: topicSlug,
          reference: referenceSlug,
          title: item.title,
          authorship: item.authorship,
          receipt_ids: item.receipt_ids,
          updated_at: item.updated_at,
        });
      }
    }
    return { items, count: items.length };
  }
  throw new StateError(`unknown reference action: ${action}`);
}

function cleanReceiptInput(payload, root) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StateError("receipt input must be a JSON object");
  }
  const receiptId = requireText(payload.receipt_id, "receipt_id");
  const topicSlug = requireSlug(payload.topic, "topic");
  const nodeId = requireSlug(payload.node, "node");
  const topic = loadTopic(root, topicSlug);
  if (!topic.nodes[nodeId]) throw new StateError(`unknown node ${nodeId} in topic ${topicSlug}`);
  if (!KINDS.has(payload.kind)) {
    throw new StateError(`kind must be one of: ${[...KINDS].sort().join(", ")}`);
  }
  if (!GRADES.has(payload.grade)) {
    throw new StateError(`grade must be one of: ${[...GRADES].sort().join(", ")}`);
  }
  const node = topic.nodes[nodeId];
  const prompt = payload.kind === "transfer" ? node.transfer_probe : node.probe;
  if (!prompt) throw new StateError(`node ${nodeId} has no transfer probe`);
  return {
    schema: SCHEMA,
    receipt_id: receiptId,
    recorded_at: payload.recorded_at ?? nowIso(),
    topic: topicSlug,
    node: nodeId,
    kind: payload.kind,
    claim: node.claim,
    probe: prompt,
    rubric: node.rubric,
    production: requireText(payload.production ?? "", "production", { allowEmpty: true }),
    confidence: validateConfidence(payload.confidence),
    grade: payload.grade,
    rubric_notes: requireText(payload.rubric_notes, "rubric_notes"),
    misconceptions: validateStringList(payload.misconceptions ?? [], "misconceptions"),
    feedback_line: requireText(payload.feedback_line, "feedback_line"),
    grader: requireText(payload.grader ?? "tutor", "grader"),
    source: requireText(payload.source ?? "self", "source"),
  };
}

function topicSummary(topic) {
  const states = { new: 0, learning: 0, review: 0, durable: 0 };
  for (const node of Object.values(topic.nodes)) states[node.state.status] += 1;
  return {
    topic: topic.topic,
    title: topic.title,
    goal: topic.goal,
    mission: topic.mission ?? null,
    sources: (topic.sources ?? []).length,
    source_gaps: topic.source_gaps ?? [],
    nodes: Object.keys(topic.nodes).length,
    states,
    mastered_nodes: Object.values(topic.nodes).filter((node) => node.state.mastered).length,
  };
}

function commandAddTopic(root, inputPath, replace) {
  const payload = readJson(inputPath);
  const topicSlug = requireSlug(payload?.topic, "topic");
  const filePath = topicPath(root, topicSlug);
  let normalizedPayload = payload;
  if (fs.existsSync(filePath)) {
    const prior = loadJson(filePath, {});
    normalizedPayload = { ...payload, created_at: payload.created_at ?? prior.created_at };
    for (const field of ["mission", "sources", "source_gaps"]) {
      if (!Object.prototype.hasOwnProperty.call(payload, field) && field in prior) {
        normalizedPayload[field] = prior[field];
      }
    }
  }
  let topic = validateTopicPayload(normalizedPayload);
  if (fs.existsSync(filePath) && !replace) {
    throw new StateError(`topic already exists: ${topic.topic} (use --replace to revise it)`);
  }
  if (fs.existsSync(filePath)) {
    const receipts = loadReceipts(root, topic.topic);
    const unknown = [...new Set(receipts.map((item) => item.node))].filter(
      (nodeId) => !topic.nodes[nodeId],
    );
    if (unknown.length) {
      throw new StateError(`replacement would orphan receipts for node(s): ${unknown.join(", ")}`);
    }
    topic = rebuildTopic(topic, receipts);
  }
  atomicWriteJson(filePath, topic);
  return topicSummary(topic);
}

function commandTopics(root) {
  const topics = listTopicSlugs(root).map((slug) => topicSummary(loadTopic(root, slug)));
  return { topics, count: topics.length };
}

function commandStatus(root, topicSlug) {
  if (!topicSlug) return commandTopics(root);
  const topic = loadTopic(root, topicSlug);
  return {
    ...topicSummary(topic),
    source_ledger: topic.sources ?? [],
    order: topic.order,
    node_states: Object.fromEntries(topic.order.map((nodeId) => [nodeId, topic.nodes[nodeId].state])),
  };
}

function commandNext(root, topicSlug) {
  const topic = loadTopic(root, topicSlug);
  const blocked = [];
  for (const nodeId of topic.order) {
    const node = topic.nodes[nodeId];
    if (node.state.status !== "new") continue;
    const unmet = node.requires.filter(
      (prerequisite) => topic.nodes[prerequisite].state.last_grade !== "recalled",
    );
    if (unmet.length) {
      blocked.push({ node: nodeId, unmet });
      continue;
    }
    return {
      topic: topicSlug,
      node: nodeId,
      claim: node.claim,
      probe: node.probe,
      rubric: node.rubric,
      requires: node.requires,
      transfer_probe: node.transfer_probe,
      arbitrary: node.arbitrary,
      threshold: node.threshold,
    };
  }
  const due = commandDue(root, topicSlug, Number.MAX_SAFE_INTEGER).items;
  return {
    topic: topicSlug,
    node: null,
    reason: due.length ? "due-work" : blocked.length ? "blocked" : "frontier-complete",
    blocked,
    due: due.length,
  };
}

function commandDue(root, topicSlug, limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new StateError("limit must be at least 1");
  const slugs = topicSlug ? [requireSlug(topicSlug, "topic")] : listTopicSlugs(root);
  const current = today();
  const items = [];
  for (const slug of slugs) {
    const topic = loadTopic(root, slug);
    for (const nodeId of topic.order) {
      const node = topic.nodes[nodeId];
      if (node.state.due && node.state.due <= current) {
        items.push({
          topic: slug,
          node: nodeId,
          due: node.state.due,
          claim: node.claim,
          probe: node.probe,
          rubric: node.rubric,
          stage: node.state.stage,
          lapses: node.state.lapses,
          transfer_probe: node.transfer_probe,
          transfer_ready: Boolean(
            node.transfer_probe && node.state.stage >= 4 && !node.state.transfer.owned,
          ),
        });
      }
    }
  }
  items.sort((left, right) =>
    [left.due, left.topic, left.node].join("\0").localeCompare(
      [right.due, right.topic, right.node].join("\0"),
    ),
  );
  return { as_of: current, items: items.slice(0, limit), total_due: items.length };
}

function loadPending(root) {
  const pending = loadJson(path.join(root, "pending.json"), []);
  if (!Array.isArray(pending) || pending.some((item) => !item || typeof item !== "object")) {
    throw new StateError("pending.json must contain an array of objects");
  }
  return pending;
}

function commandStashAdd(root, inputPath) {
  const payload = readJson(inputPath);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StateError("stash input must be a JSON object");
  }
  const topicSlug = requireSlug(payload.topic, "topic");
  const nodeId = requireSlug(payload.node, "node");
  const topic = loadTopic(root, topicSlug);
  if (!topic.nodes[nodeId]) throw new StateError(`unknown node ${nodeId} in topic ${topicSlug}`);
  if (!KINDS.has(payload.kind)) {
    throw new StateError(`kind must be one of: ${[...KINDS].sort().join(", ")}`);
  }
  const node = topic.nodes[nodeId];
  const prompt = payload.kind === "transfer" ? node.transfer_probe : node.probe;
  if (!prompt) throw new StateError(`node ${nodeId} has no transfer probe`);
  const item = {
    attempt_id: `a_${crypto.randomUUID().replaceAll("-", "")}`,
    created_at: nowIso(),
    topic: topicSlug,
    node: nodeId,
    kind: payload.kind,
    claim: node.claim,
    probe: prompt,
    rubric: node.rubric,
    production: requireText(payload.production ?? "", "production", { allowEmpty: true }),
    confidence: validateConfidence(payload.confidence),
    source: requireText(payload.source ?? "self", "source"),
  };
  const pending = loadPending(root);
  pending.push(item);
  atomicWriteJson(path.join(root, "pending.json"), pending);
  return item;
}

function commandStash(root, action, inputPath) {
  if (action === "add") {
    if (!inputPath) throw new StateError("stash add requires --file");
    return commandStashAdd(root, inputPath);
  }
  const pending = loadPending(root);
  if (action === "list") return { items: pending, count: pending.length };
  if (action === "count") return { count: pending.length };
  throw new StateError(`unknown stash action: ${action}`);
}

function assessmentItems(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return [payload];
  if (Array.isArray(payload) && payload.every((item) => item && typeof item === "object")) {
    return payload;
  }
  throw new StateError("assessment input must be an object or an array of objects");
}

function commandSettle(root, inputPath) {
  const assessments = assessmentItems(readJson(inputPath));
  let pending = loadPending(root);
  const pendingById = new Map(pending.map((item) => [item.attempt_id, item]));
  const existing = allReceiptIds(root);
  const applied = [];
  const skipped = [];
  const settledIds = new Set();
  const affectedTopics = new Set();

  for (const assessment of assessments) {
    const attemptId = requireText(assessment.attempt_id, "attempt_id");
    if (existing.has(attemptId)) {
      skipped.push(attemptId);
      settledIds.add(attemptId);
      continue;
    }
    const item = pendingById.get(attemptId);
    if (!item) throw new StateError(`assessment references unknown pending attempt: ${attemptId}`);
    if (!GRADES.has(assessment.grade)) {
      throw new StateError(`grade must be one of: ${[...GRADES].sort().join(", ")}`);
    }
    const receipt = {
      schema: SCHEMA,
      receipt_id: attemptId,
      recorded_at: nowIso(),
      topic: item.topic,
      node: item.node,
      kind: item.kind,
      claim: item.claim,
      probe: item.probe,
      rubric: item.rubric,
      production: item.production,
      confidence: item.confidence,
      grade: assessment.grade,
      rubric_notes: requireText(assessment.rubric_notes, "rubric_notes"),
      misconceptions: validateStringList(assessment.misconceptions ?? [], "misconceptions"),
      feedback_line: requireText(assessment.feedback_line, "feedback_line"),
      grader: requireText(assessment.grader, "grader"),
      source: item.source,
    };
    appendReceipt(root, receipt);
    existing.add(attemptId);
    applied.push(attemptId);
    settledIds.add(attemptId);
    affectedTopics.add(item.topic);
  }

  if (settledIds.size) {
    pending = pending.filter((item) => !settledIds.has(item.attempt_id));
    atomicWriteJson(path.join(root, "pending.json"), pending);
  }
  for (const topic of affectedTopics) loadTopic(root, topic, { persistRebuild: true });
  return { applied, skipped, pending: pending.length };
}

function commandRecord(root, inputPath) {
  const receipt = cleanReceiptInput(readJson(inputPath), root);
  const existing = findReceipt(root, receipt.receipt_id);
  if (existing) {
    const stableFields = Object.keys(receipt).filter((field) => field !== "recorded_at");
    if (stableFields.some((field) => JSON.stringify(existing[field]) !== JSON.stringify(receipt[field]))) {
      throw new StateError(`receipt_id collision with different content: ${receipt.receipt_id}`);
    }
    return { applied: false, receipt_id: receipt.receipt_id, reason: "duplicate" };
  }
  appendReceipt(root, receipt);
  loadTopic(root, receipt.topic, { persistRebuild: true });
  return { applied: true, receipt_id: receipt.receipt_id };
}

function misconceptionRows(root, topicFilter = null) {
  const rows = new Map();
  const laterRecall = new Map();
  for (const topic of listTopicSlugs(root)) {
    if (topicFilter && topic !== topicFilter) continue;
    const receipts = loadReceipts(root, topic);
    for (const receipt of receipts) {
      const nodeKey = `${topic}\0${receipt.node}`;
      if (receipt.grade === "recalled" && receipt.kind !== "transfer") {
        const current = laterRecall.get(nodeKey);
        if (!current || receipt.recorded_at > current) laterRecall.set(nodeKey, receipt.recorded_at);
      }
      for (const text of receipt.misconceptions ?? []) {
        const normalized = text.toLowerCase().trim().replaceAll(/\s+/g, " ");
        const key = `${nodeKey}\0${normalized}`;
        const row = rows.get(key) ?? {
          topic,
          node: receipt.node,
          misconception: text,
          count: 0,
          last_seen: receipt.recorded_at,
        };
        row.count += 1;
        if (receipt.recorded_at >= row.last_seen) {
          row.last_seen = receipt.recorded_at;
          row.misconception = text;
        }
        rows.set(key, row);
      }
    }
  }
  for (const row of rows.values()) {
    const recalledAt = laterRecall.get(`${row.topic}\0${row.node}`);
    row.open = !recalledAt || recalledAt <= row.last_seen;
  }
  return [...rows.values()].sort((left, right) => {
    if (left.open !== right.open) return left.open ? -1 : 1;
    return `${left.topic}\0${left.node}`.localeCompare(`${right.topic}\0${right.node}`);
  });
}

function commandStats(root) {
  const allReceipts = [];
  const summaries = [];
  const encodedAt = new Map();
  const reviewedAt = new Map();
  const transferLatest = new Map();
  for (const topic of listTopicSlugs(root)) {
    summaries.push(topicSummary(loadTopic(root, topic)));
    const receipts = loadReceipts(root, topic);
    allReceipts.push(...receipts);
    for (const receipt of receipts) {
      const key = `${topic}\0${receipt.node}`;
      if (receipt.kind === "encode") {
        const current = encodedAt.get(key);
        if (!current || receipt.recorded_at < current) encodedAt.set(key, receipt.recorded_at);
      } else if (receipt.kind === "review") {
        const values = reviewedAt.get(key) ?? [];
        values.push(receipt.recorded_at);
        reviewedAt.set(key, values);
      } else if (receipt.kind === "transfer") {
        transferLatest.set(key, receipt.grade);
      }
    }
  }

  const reviewReceipts = allReceipts.filter((item) => item.kind === "review");
  const reviewCounts = { lapsed: 0, partial: 0, recalled: 0 };
  for (const receipt of reviewReceipts) reviewCounts[receipt.grade] += 1;
  const reviewN = reviewReceipts.length;
  const due = commandDue(root, null, Number.MAX_SAFE_INTEGER);
  const calibrationItems = allReceipts.filter(
    (item) => item.kind !== "transfer" && item.confidence !== null && item.confidence !== undefined,
  );
  let calibration = null;
  if (calibrationItems.length) {
    const probabilities = calibrationItems.map((item) => item.confidence / 100);
    const outcomes = calibrationItems.map((item) => (item.grade === "recalled" ? 1 : 0));
    const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
    calibration = {
      n: calibrationItems.length,
      mean_confidence: Number(mean(probabilities).toFixed(3)),
      observed_recall: Number(mean(outcomes).toFixed(3)),
      brier: Number(
        mean(probabilities.map((probability, index) => (probability - outcomes[index]) ** 2)).toFixed(
          4,
        ),
      ),
    };
  }
  const closureCount = [...encodedAt.entries()].filter(([key, encodedTime]) =>
    (reviewedAt.get(key) ?? []).some((reviewTime) => reviewTime > encodedTime),
  ).length;
  const transferOwned = [...transferLatest.values()].filter((grade) => grade === "recalled").length;
  const misconceptions = misconceptionRows(root);
  return {
    as_of: today(),
    loop_closure: {
      encoded_nodes: encodedAt.size,
      reviewed_after_encoding: closureCount,
      rate: encodedAt.size ? Number((closureCount / encodedAt.size).toFixed(3)) : null,
    },
    review_recall: {
      n: reviewN,
      counts: reviewCounts,
      recalled_rate: reviewN ? Number((reviewCounts.recalled / reviewN).toFixed(3)) : null,
    },
    unmeasured_due: due.total_due,
    transfer: {
      nodes_tested: transferLatest.size,
      nodes_currently_owned: transferOwned,
      owned_rate: transferLatest.size
        ? Number((transferOwned / transferLatest.size).toFixed(3))
        : null,
    },
    calibration,
    misconceptions: {
      open: misconceptions.filter((row) => row.open).length,
      total: misconceptions.length,
    },
    pending_assessment: loadPending(root).length,
    topics: summaries,
  };
}

function commandProfile(root) {
  return loadJson(path.join(root, "learner.json"), DEFAULT_PROFILE);
}

function commandUpdateProfile(root, inputPath) {
  const update = readJson(inputPath);
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    throw new StateError("profile update must be a JSON object");
  }
  const allowed = new Set(["interests", "preferences", "commitment"]);
  const unknown = Object.keys(update).filter((key) => !allowed.has(key));
  if (unknown.length) throw new StateError(`unknown profile field(s): ${unknown.sort().join(", ")}`);
  const profile = commandProfile(root);
  if ("interests" in update) profile.interests = validateStringList(update.interests, "interests");
  if ("preferences" in update) {
    if (!update.preferences || typeof update.preferences !== "object" || Array.isArray(update.preferences)) {
      throw new StateError("preferences must be an object");
    }
    profile.preferences = { ...(profile.preferences ?? {}), ...update.preferences };
  }
  if ("commitment" in update) {
    if (
      update.commitment !== null &&
      (!update.commitment || typeof update.commitment !== "object" || Array.isArray(update.commitment))
    ) {
      throw new StateError("commitment must be an object or null");
    }
    profile.commitment = update.commitment;
  }
  profile.schema = SCHEMA;
  profile.updated_at = nowIso();
  atomicWriteJson(path.join(root, "learner.json"), profile);
  return profile;
}

function commandDoctor(root) {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  for (const topic of listTopicSlugs(root)) {
    try {
      const filePath = topicPath(root, topic);
      const raw = loadJson(filePath, {});
      const receipts = loadReceipts(root, topic);
      const rebuilt = rebuildTopic(raw, receipts);
      if (JSON.stringify(rebuilt) !== JSON.stringify(raw)) {
        warnings.push(`${topic}: derived state was stale and has been repaired`);
        atomicWriteJson(filePath, rebuilt);
      }
      for (const receipt of receipts) {
        const receiptId = receipt.receipt_id;
        if (typeof receiptId !== "string" || !receiptId) {
          errors.push(`${topic}: receipt missing receipt_id`);
        } else if (seenIds.has(receiptId)) {
          errors.push(`duplicate receipt_id: ${receiptId}`);
        } else {
          seenIds.add(receiptId);
        }
      }
      const milestones = loadMilestones(root, topic);
      const milestoneIds = new Set();
      for (const milestone of milestones) {
        if (milestone.topic !== topic) {
          errors.push(`${topic}: milestone ${milestone.milestone_id ?? "<unknown>"} has wrong topic`);
        }
        if (typeof milestone.milestone_id !== "string" || !milestone.milestone_id) {
          errors.push(`${topic}: milestone missing milestone_id`);
        } else if (milestoneIds.has(milestone.milestone_id)) {
          errors.push(`${topic}: duplicate milestone_id ${milestone.milestone_id}`);
        } else {
          milestoneIds.add(milestone.milestone_id);
        }
        if (!MILESTONE_KINDS.has(milestone.kind)) {
          errors.push(`${topic}: milestone ${milestone.milestone_id ?? "<unknown>"} has invalid kind`);
        }
        for (const receiptId of milestone.receipt_ids ?? []) {
          if (!receipts.some((receipt) => receipt.receipt_id === receiptId)) {
            errors.push(`${topic}: milestone ${milestone.milestone_id ?? "<unknown>"} has unknown receipt ${receiptId}`);
          }
        }
        if (
          RECEIPT_BACKED_MILESTONES.has(milestone.kind) &&
          !(milestone.receipt_ids ?? []).some((receiptId) => {
            const receipt = receipts.find((candidate) => candidate.receipt_id === receiptId);
            return receipt && isRecallEvidence(receipt);
          })
        ) {
          errors.push(`${topic}: milestone ${milestone.milestone_id ?? "<unknown>"} lacks recalled evidence`);
        }
      }
      const supersededMilestones = new Set();
      for (const milestone of milestones) {
        for (const priorId of milestone.supersedes ?? []) {
          if (!milestoneIds.has(priorId)) {
            errors.push(`${topic}: milestone ${milestone.milestone_id ?? "<unknown>"} supersedes unknown ${priorId}`);
          } else if (supersededMilestones.has(priorId)) {
            errors.push(`${topic}: milestone ${priorId} has multiple successors`);
          } else {
            supersededMilestones.add(priorId);
          }
        }
      }
      for (const reference of listReferenceSlugs(root, topic)) {
        const item = loadReference(root, topic, reference);
        if (!REFERENCE_AUTHORSHIP.has(item.authorship)) {
          errors.push(`${topic}: reference ${reference} has invalid authorship`);
        }
        for (const receiptId of item.receipt_ids ?? []) {
          if (!receipts.some((receipt) => receipt.receipt_id === receiptId)) {
            errors.push(`${topic}: reference ${reference} has unknown receipt ${receiptId}`);
          }
        }
        if (
          !(item.receipt_ids ?? []).some((receiptId) => {
            const receipt = receipts.find((candidate) => candidate.receipt_id === receiptId);
            return receipt && isRecallEvidence(receipt);
          })
        ) {
          errors.push(`${topic}: reference ${reference} lacks recalled evidence`);
        }
      }
    } catch (error) {
      errors.push(`${topic}: ${error.message}`);
    }
  }
  try {
    const pending = loadPending(root);
    const pendingIds = pending.map((item) => item.attempt_id);
    if (new Set(pendingIds).size !== pendingIds.length) {
      errors.push("pending.json contains duplicate attempt_id values");
    }
    if (pending.length) warnings.push(`${pending.length} pending assessment item(s)`);
  } catch (error) {
    errors.push(error.message);
  }
  return { ok: errors.length === 0, errors, warnings, root };
}

function option(args, name, { required = false, fallback = undefined } = {}) {
  const index = args.indexOf(name);
  if (index === -1) {
    if (required) throw new StateError(`${name} is required`);
    return fallback;
  }
  if (index === args.length - 1 || args[index + 1].startsWith("--")) {
    throw new StateError(`${name} requires a value`);
  }
  return args[index + 1];
}

function help() {
  return `Usage: learning-state.mjs <command> [options]

Commands:
  init                              Initialize local state
  path                              Print the state path
  new-id [--kind receipt|milestone] Generate an append-only record id
  add-topic --file FILE [--replace] Add or revise a concept graph
  topics                            List topics
  status [--topic TOPIC]            Show topic state
  next --topic TOPIC                Select the next prerequisite-ready node
  due [--topic TOPIC] [--limit N]   Show due reviews
  milestone add --file FILE         Add an evidence-linked learning milestone
  milestone list [--topic TOPIC]    List active and superseded milestones
  reference add --file FILE [--replace]
                                    Save or revise learner-authored reference text
  reference list [--topic TOPIC]    List saved references
  reference show --topic TOPIC --reference REF
                                    Show one saved reference
  profile                           Show the learner profile
  update-profile --file FILE        Update allowed profile fields
  stash add --file FILE             Persist a pending production
  stash list|count                  Inspect pending productions
  settle --file FILE                Apply assessed pending work idempotently
  record --file FILE                Record a directly graded receipt
  stats                             Show evidence-based learning statistics
  misconceptions [--topic TOPIC]    Show the misconception ledger
  doctor                            Validate and repair derived state

Runtime: Node.js 18+; no external packages.
State: ~/.teach-me (override with TEACH_ME_HOME).
Tests: set TEACH_ME_TODAY=YYYY-MM-DD to freeze dates.`;
}

function dispatch(root, argv) {
  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(`${help()}\n`);
    return { noJson: true, exitCode: 0 };
  }
  if (command === "path") return { root };
  if (command === "new-id") {
    const kind = option(args, "--kind", { fallback: "receipt" });
    if (kind === "receipt") {
      return { receipt_id: `r_${crypto.randomUUID().replaceAll("-", "")}` };
    }
    if (kind === "milestone") {
      return { milestone_id: `m_${crypto.randomUUID().replaceAll("-", "")}` };
    }
    throw new StateError("--kind must be receipt or milestone");
  }
  initialize(root);
  if (command === "init") return { initialized: true, root };
  if (command === "add-topic") {
    return commandAddTopic(root, option(args, "--file", { required: true }), args.includes("--replace"));
  }
  if (command === "topics") return commandTopics(root);
  if (command === "status") return commandStatus(root, option(args, "--topic"));
  if (command === "next") return commandNext(root, option(args, "--topic", { required: true }));
  if (command === "due") {
    const rawLimit = option(args, "--limit", { fallback: "20" });
    return commandDue(root, option(args, "--topic"), Number(rawLimit));
  }
  if (command === "milestone") {
    return commandMilestone(
      root,
      args[0],
      option(args, "--file"),
      option(args, "--topic"),
    );
  }
  if (command === "reference") {
    return commandReference(
      root,
      args[0],
      option(args, "--file"),
      option(args, "--topic"),
      option(args, "--reference"),
      args.includes("--replace"),
    );
  }
  if (command === "profile") return commandProfile(root);
  if (command === "update-profile") {
    return commandUpdateProfile(root, option(args, "--file", { required: true }));
  }
  if (command === "stash") {
    return commandStash(root, args[0], option(args, "--file"));
  }
  if (command === "settle") {
    return commandSettle(root, option(args, "--file", { required: true }));
  }
  if (command === "record") {
    return commandRecord(root, option(args, "--file", { required: true }));
  }
  if (command === "stats") return commandStats(root);
  if (command === "misconceptions") {
    const topic = option(args, "--topic");
    if (topic) requireSlug(topic, "topic");
    const items = misconceptionRows(root, topic);
    return { items, open: items.filter((row) => row.open).length };
  }
  if (command === "doctor") {
    const result = commandDoctor(root);
    return { ...result, exitCode: result.ok ? 0 : 1 };
  }
  throw new StateError(`unknown command: ${command}`);
}

function main() {
  const root = stateRoot();
  try {
    const argv = process.argv.slice(2);
    const lockFree = new Set([undefined, "--help", "-h", "help", "path", "new-id"]);
    const result = lockFree.has(argv[0])
      ? dispatch(root, argv)
      : withStateLock(root, () => dispatch(root, argv));
    if (!result.noJson) {
      const { exitCode = 0, ...output } = result;
      printJson(output);
      process.exitCode = exitCode;
    }
  } catch (error) {
    printJson({ error: error.message });
    process.exitCode = error instanceof StateError ? 2 : 1;
  }
}

main();
