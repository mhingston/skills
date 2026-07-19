#!/usr/bin/env node

/*
 * FSRS-4.5 scheduling and replay concepts were informed by and adapted from
 * nagisanzenin/engram (MIT). See ../THIRD_PARTY_NOTICES.md.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE_VERSION = "1.0.0";
const SCHEDULER = "fsrs-4.5";
const RETENTION = 0.9;
const INTERVAL_MULTIPLIER = 1.0;
const INTERVAL_MAX_DAYS = 365;
const DECAY = -0.5;
const FACTOR = 19 / 81;
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
];
const RATINGS = new Map([
  ["again", 1],
  ["hard", 2],
  ["good", 3],
  ["easy", 4],
]);
const MEMORY_KINDS = new Set(["pretest", "encode", "review"]);
const GRADES = new Set(["recalled", "partial", "lapsed"]);
const MUTATING_HELPER_COMMANDS = new Set(["init", "add-topic", "record", "settle"]);
const helperPath = fileURLToPath(new URL("./learning-state.mjs", import.meta.url));

class EngineError extends Error {}

function clone(value) {
  return structuredClone(value);
}

function expandHome(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function stateRoot() {
  const override = process.env.TEACH_ME_HOME;
  return override ? path.resolve(expandHome(override)) : path.join(os.homedir(), ".teach-me");
}

function todayText() {
  const frozen = process.env.TEACH_ME_TODAY;
  if (frozen) {
    parseDate(frozen, "TEACH_ME_TODAY");
    return frozen;
  }
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return process.env.TEACH_ME_TODAY
    ? `${todayText()}T12:00:00.000Z`
    : new Date().toISOString();
}

function parseDate(value, label = "date") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new EngineError(`${label} must use YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new EngineError(`invalid ${label}: ${value}`);
  }
  return parsed;
}

function dateFromTimestamp(value, label = "timestamp") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new EngineError(`invalid ${label}: ${value}`);
  return parsed.toISOString().slice(0, 10);
}

function addDays(dateText, days) {
  const date = parseDate(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(left, right) {
  return Math.floor((parseDate(right).valueOf() - parseDate(left).valueOf()) / 86_400_000);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, places = 6) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function retrievability(elapsedDays, stability) {
  if (!Number.isFinite(stability) || stability <= 0) return 0;
  return (1 + (FACTOR * elapsedDays) / stability) ** DECAY;
}

function intervalFor(stability) {
  const days =
    (stability / FACTOR) *
    (RETENTION ** (1 / DECAY) - 1) *
    INTERVAL_MULTIPLIER;
  return clamp(Math.round(days), 1, INTERVAL_MAX_DAYS);
}

function initialStability(rating) {
  return clamp(W[rating - 1], 0.1, 100);
}

function initialDifficulty(rating) {
  return clamp(W[4] - (rating - 3) * W[5], 1, 10);
}

function nextDifficulty(difficulty, rating) {
  const next = difficulty - W[6] * (rating - 3);
  return clamp(W[7] * initialDifficulty(3) + (1 - W[7]) * next, 1, 10);
}

function nextStabilityRecall(difficulty, stability, recall, rating) {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  const growth =
    Math.exp(W[8]) *
    (11 - difficulty) *
    stability ** -W[9] *
    (Math.exp(W[10] * (1 - recall)) - 1) *
    hardPenalty *
    easyBonus;
  return clamp(stability * (1 + growth), 0.1, 36_500);
}

function nextStabilityForget(difficulty, stability, recall) {
  const forgotten =
    W[11] *
    difficulty ** -W[12] *
    ((stability + 1) ** W[13] - 1) *
    Math.exp(W[14] * (1 - recall));
  return clamp(Math.min(forgotten, stability), 0.1, 36_500);
}

function ratingForReceipt(receipt) {
  if (receipt.kind === "transfer") return null;
  if (!MEMORY_KINDS.has(receipt.kind)) return null;
  if (!GRADES.has(receipt.grade)) {
    throw new EngineError(`receipt ${receipt.receipt_id ?? "<unknown>"} has invalid grade`);
  }
  if (receipt.source === "told") return "hard";
  if (receipt.scheduler_rating !== undefined) {
    if (!RATINGS.has(receipt.scheduler_rating)) {
      throw new EngineError(
        `receipt ${receipt.receipt_id ?? "<unknown>"} has invalid scheduler_rating`,
      );
    }
    return receipt.scheduler_rating;
  }
  if (receipt.grade === "lapsed") return "again";
  if (receipt.grade === "partial") return "hard";
  return "good";
}

function applyRating(previous, ratingName, onDate) {
  const rating = RATINGS.get(ratingName);
  if (!rating) throw new EngineError(`unknown rating: ${ratingName}`);

  let stability;
  let difficulty;
  let recall = null;
  let elapsedDays = null;
  if (!previous) {
    stability = initialStability(rating);
    difficulty = initialDifficulty(rating);
  } else {
    elapsedDays = Math.max(0, daysBetween(previous.last, onDate));
    recall = retrievability(elapsedDays, previous.stability);
    difficulty = nextDifficulty(previous.difficulty, rating);
    stability =
      rating === 1
        ? nextStabilityForget(previous.difficulty, previous.stability, recall)
        : nextStabilityRecall(previous.difficulty, previous.stability, recall, rating);
  }

  const intervalDays = intervalFor(stability);
  return {
    stability,
    difficulty,
    last: onDate,
    due: addDays(onDate, intervalDays),
    reps: (previous?.reps ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (rating === 1 ? 1 : 0),
    interval_days: intervalDays,
    elapsed_days: elapsedDays,
    retrievability: recall,
  };
}

function readJson(filePath, fallback = undefined) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return clone(fallback);
    throw new EngineError(`file does not exist: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new EngineError(`invalid JSON in ${filePath}: ${error.message}`);
  }
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const values = [];
  const seen = new Set();
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    let value;
    try {
      value = JSON.parse(line);
    } catch (error) {
      throw new EngineError(`invalid JSONL in ${filePath}:${index + 1}: ${error.message}`);
    }
    const id = value.receipt_id;
    if (typeof id !== "string" || !id) {
      throw new EngineError(`receipt missing receipt_id in ${filePath}:${index + 1}`);
    }
    if (seen.has(id)) throw new EngineError(`duplicate receipt_id ${id} in ${filePath}`);
    seen.add(id);
    values.push({ ...value, _sequence: index });
  });
  return values;
}

function appendJsonLine(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, { encoding: "utf8", mode: 0o600 });
}

function topicSlugs(root) {
  const directory = path.join(root, "topics");
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -5))
    .sort();
}

function loadTopic(root, topic) {
  return readJson(path.join(root, "topics", `${topic}.json`));
}

function loadReceipts(root, topic) {
  return readJsonLines(path.join(root, "receipts", `${topic}.jsonl`));
}

function sortedReceipts(receipts) {
  return [...receipts].sort((left, right) => {
    const leftTime = new Date(left.recorded_at).valueOf();
    const rightTime = new Date(right.recorded_at).valueOf();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
      throw new EngineError("every receipt must have a valid recorded_at timestamp");
    }
    return leftTime - rightTime || left._sequence - right._sequence;
  });
}

function replayTopic(root, topicSlug) {
  const topic = loadTopic(root, topicSlug);
  const states = new Map();
  const transitions = [];

  for (const receipt of sortedReceipts(loadReceipts(root, topicSlug))) {
    if (receipt.topic !== topicSlug) {
      throw new EngineError(`receipt ${receipt.receipt_id} has topic ${receipt.topic}`);
    }
    const node = topic.nodes?.[receipt.node];
    if (!node) throw new EngineError(`receipt ${receipt.receipt_id} references unknown node`);
    const rating = ratingForReceipt(receipt);
    if (!rating) continue;

    const key = receipt.node;
    const before = states.get(key) ?? null;
    const onDate = dateFromTimestamp(receipt.recorded_at, "receipt recorded_at");
    const after = applyRating(before, rating, onDate);
    states.set(key, after);
    transitions.push({
      schema: 1,
      projection_id: `${ENGINE_VERSION}:${receipt.receipt_id}`,
      engine_version: ENGINE_VERSION,
      scheduler: SCHEDULER,
      policy: { desired_retention: RETENTION, interval_multiplier: INTERVAL_MULTIPLIER },
      projected_at: nowIso(),
      receipt_id: receipt.receipt_id,
      topic: topicSlug,
      node: receipt.node,
      kind: receipt.kind,
      grade: receipt.grade,
      source: receipt.source ?? "self",
      rating,
      on_date: onDate,
      before: before
        ? {
            stability: round(before.stability),
            difficulty: round(before.difficulty),
            last: before.last,
            due: before.due,
            reps: before.reps,
            lapses: before.lapses,
          }
        : null,
      after: {
        stability: round(after.stability),
        difficulty: round(after.difficulty),
        retrievability:
          after.retrievability === null ? null : round(after.retrievability),
        elapsed_days: after.elapsed_days,
        interval_days: after.interval_days,
        last: after.last,
        due: after.due,
        reps: after.reps,
        lapses: after.lapses,
      },
    });
  }

  return { topic, states, transitions };
}

function replay(root, topicFilter = null) {
  const topics = topicFilter ? [topicFilter] : topicSlugs(root);
  const results = [];
  for (const topic of topics) results.push(replayTopic(root, topic));
  return results;
}

function transitionComparable(value) {
  const copy = clone(value);
  delete copy.projected_at;
  return copy;
}

function schedulerPath(root, topic) {
  return path.join(root, "scheduler-receipts", `${topic}.jsonl`);
}

function readSchedulerRows(root, topic) {
  const filePath = schedulerPath(root, topic);
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new EngineError(`invalid scheduler JSONL in ${filePath}:${index + 1}`);
      }
    });
}

function syncScheduler(root, topicFilter = null) {
  const appended = [];
  const unchanged = [];
  for (const result of replay(root, topicFilter)) {
    const existing = new Map(
      readSchedulerRows(root, result.topic.topic).map((row) => [row.projection_id, row]),
    );
    for (const transition of result.transitions) {
      const prior = existing.get(transition.projection_id);
      if (prior) {
        if (
          JSON.stringify(transitionComparable(prior)) !==
          JSON.stringify(transitionComparable(transition))
        ) {
          throw new EngineError(
            `scheduler projection drift for ${transition.receipt_id}; run scheduler-doctor`,
          );
        }
        unchanged.push(transition.projection_id);
        continue;
      }
      appendJsonLine(schedulerPath(root, result.topic.topic), transition);
      appended.push(transition.projection_id);
    }
  }
  return { engine_version: ENGINE_VERSION, appended, unchanged };
}

function dueQueue(root, { topic = null, limit = 20 } = {}) {
  const asOf = todayText();
  const items = [];
  for (const result of replay(root, topic)) {
    for (const [nodeId, state] of result.states.entries()) {
      if (state.due > asOf) continue;
      const node = result.topic.nodes[nodeId];
      const elapsed = Math.max(0, daysBetween(state.last, asOf));
      items.push({
        topic: result.topic.topic,
        title: result.topic.title,
        node: nodeId,
        claim: node.claim,
        probe: node.probe,
        due: state.due,
        overdue_days: Math.max(0, daysBetween(state.due, asOf)),
        stability: round(state.stability),
        difficulty: round(state.difficulty),
        retrievability: round(retrievability(elapsed, state.stability)),
        reps: state.reps,
        lapses: state.lapses,
      });
    }
  }
  items.sort((left, right) =>
    [left.due, left.topic, left.node].join("\0").localeCompare(
      [right.due, right.topic, right.node].join("\0"),
    ),
  );
  return {
    as_of: asOf,
    engine_version: ENGINE_VERSION,
    scheduler: SCHEDULER,
    total_due: items.length,
    items: items.slice(0, limit),
  };
}

function schedulerDoctor(root) {
  const errors = [];
  const warnings = [];
  let receipts = 0;
  let currentProjections = 0;

  for (const result of replay(root)) {
    receipts += result.transitions.length;
    const expected = new Map(result.transitions.map((item) => [item.projection_id, item]));
    const rows = readSchedulerRows(root, result.topic.topic);
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.projection_id)) errors.push(`duplicate projection_id: ${row.projection_id}`);
      seen.add(row.projection_id);
      const wanted = expected.get(row.projection_id);
      if (!wanted) continue;
      currentProjections += 1;
      if (
        JSON.stringify(transitionComparable(row)) !==
        JSON.stringify(transitionComparable(wanted))
      ) {
        errors.push(`projection drift: ${row.projection_id}`);
      }
    }
    for (const projectionId of expected.keys()) {
      if (!seen.has(projectionId)) warnings.push(`unsynced projection: ${projectionId}`);
    }
  }

  return {
    ok: errors.length === 0,
    engine_version: ENGINE_VERSION,
    scheduler: SCHEDULER,
    receipts,
    current_projections: currentProjections,
    errors,
    warnings,
  };
}

function runHelper(args) {
  if (!fs.existsSync(helperPath)) throw new EngineError(`state helper not found: ${helperPath}`);
  return spawnSync(process.execPath, [helperPath, ...args], {
    encoding: "utf8",
    env: process.env,
  });
}

function parsedOutput(result) {
  if (!result.stdout.trim()) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return result.stdout.trim();
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function integerOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  if (!Number.isInteger(value) || value < 1) throw new EngineError(`${name} must be positive`);
  return value;
}

function stringOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
}

function selftest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "teach-me-engine-"));
  const previousHome = process.env.TEACH_ME_HOME;
  const previousToday = process.env.TEACH_ME_TODAY;
  try {
    process.env.TEACH_ME_HOME = root;
    process.env.TEACH_ME_TODAY = "2026-07-19";
    fs.mkdirSync(path.join(root, "topics"), { recursive: true });
    fs.mkdirSync(path.join(root, "receipts"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "topics", "demo.json"),
      JSON.stringify({
        topic: "demo",
        title: "Demo",
        nodes: { concept: { claim: "A claim", probe: "Recall it" } },
      }),
    );
    const receiptFile = path.join(root, "receipts", "demo.jsonl");
    appendJsonLine(receiptFile, {
      receipt_id: "r1",
      recorded_at: "2026-07-17T12:00:00.000Z",
      topic: "demo",
      node: "concept",
      kind: "encode",
      grade: "recalled",
      source: "self",
    });
    const first = replayTopic(root, "demo");
    assert.equal(first.transitions.length, 1);
    assert.equal(first.transitions[0].rating, "good");
    assert.equal(first.transitions[0].after.due, "2026-07-21");
    assert.equal(dueQueue(root).total_due, 0);

    process.env.TEACH_ME_TODAY = "2026-07-21";
    assert.equal(dueQueue(root).total_due, 1);
    const synced = syncScheduler(root);
    assert.equal(synced.appended.length, 1);
    assert.equal(syncScheduler(root).appended.length, 0);
    assert.equal(schedulerDoctor(root).ok, true);

    appendJsonLine(receiptFile, {
      receipt_id: "r2",
      recorded_at: "2026-07-21T12:00:00.000Z",
      topic: "demo",
      node: "concept",
      kind: "review",
      grade: "lapsed",
      source: "self",
    });
    const second = replayTopic(root, "demo");
    assert.equal(second.transitions.at(-1).rating, "again");
    assert.equal(second.transitions.at(-1).after.lapses, 1);
    assert.ok(
      second.transitions.at(-1).after.stability <=
        second.transitions.at(-1).before.stability,
    );
    return { ok: true, checks: 11, engine_version: ENGINE_VERSION, scheduler: SCHEDULER };
  } finally {
    if (previousHome === undefined) delete process.env.TEACH_ME_HOME;
    else process.env.TEACH_ME_HOME = previousHome;
    if (previousToday === undefined) delete process.env.TEACH_ME_TODAY;
    else process.env.TEACH_ME_TODAY = previousToday;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const root = stateRoot();

  if (!command || command === "help" || command === "--help") {
    printJson({
      engine_version: ENGINE_VERSION,
      commands: [
        "due [--topic <slug>] [--limit <n>]",
        "due-summary [--topic <slug>] [--limit <n>]",
        "scheduler-status --topic <slug>",
        "scheduler-sync [--topic <slug>]",
        "scheduler-doctor",
        "scheduler-replay [--topic <slug>]",
        "export",
        "selftest",
        "version",
        "all learning-state.mjs commands (proxied)",
      ],
    });
    return;
  }

  if (command === "version") {
    printJson({ engine_version: ENGINE_VERSION, scheduler: SCHEDULER });
    return;
  }
  if (command === "selftest") {
    printJson(selftest());
    return;
  }
  if (command === "due" || command === "due-summary") {
    const topic = stringOption(args, "--topic");
    const limit = integerOption(args, "--limit", command === "due-summary" ? 5 : 20);
    const due = dueQueue(root, { topic, limit });
    if (command === "due-summary") {
      printJson({
        ...due,
        silent: due.total_due === 0,
        message:
          due.total_due === 0
            ? null
            : `${due.total_due} review${due.total_due === 1 ? "" : "s"} due`,
      });
    } else {
      printJson(due);
    }
    return;
  }
  if (command === "scheduler-status") {
    const topic = stringOption(args, "--topic");
    if (!topic) throw new EngineError("scheduler-status requires --topic");
    const result = replayTopic(root, topic);
    printJson({
      topic,
      engine_version: ENGINE_VERSION,
      scheduler: SCHEDULER,
      nodes: Object.fromEntries(
        [...result.states.entries()].map(([node, state]) => [node, {
          stability: round(state.stability),
          difficulty: round(state.difficulty),
          last: state.last,
          due: state.due,
          reps: state.reps,
          lapses: state.lapses,
        }]),
      ),
    });
    return;
  }
  if (command === "scheduler-sync") {
    printJson(syncScheduler(root, stringOption(args, "--topic")));
    return;
  }
  if (command === "scheduler-replay") {
    printJson({
      engine_version: ENGINE_VERSION,
      topics: replay(root, stringOption(args, "--topic")).map((result) => ({
        topic: result.topic.topic,
        transitions: result.transitions,
      })),
    });
    return;
  }
  if (command === "scheduler-doctor") {
    printJson(schedulerDoctor(root));
    return;
  }
  if (command === "export") {
    printJson({
      schema: 1,
      exported_at: nowIso(),
      engine_version: ENGINE_VERSION,
      scheduler: SCHEDULER,
      learner: readJson(path.join(root, "learner.json"), null),
      topics: replay(root).map((result) => ({
        topic: result.topic,
        receipts: loadReceipts(root, result.topic.topic).map(({ _sequence, ...item }) => item),
        scheduler_transitions: result.transitions,
      })),
    });
    return;
  }

  const helperResult = runHelper(args);
  if (helperResult.status !== 0) {
    if (helperResult.stdout) process.stdout.write(helperResult.stdout);
    if (helperResult.stderr) process.stderr.write(helperResult.stderr);
    process.exitCode = helperResult.status ?? 1;
    return;
  }

  const output = parsedOutput(helperResult);
  if (command === "doctor") {
    const scheduler = schedulerDoctor(root);
    printJson({
      helper: output,
      scheduler,
      ok: Boolean(output?.ok) && scheduler.ok,
    });
    return;
  }
  if (command === "stats") {
    const due = dueQueue(root, { limit: 20 });
    printJson({ ...output, memory: { engine_version: ENGINE_VERSION, scheduler: SCHEDULER, due } });
    return;
  }

  if (MUTATING_HELPER_COMMANDS.has(command)) {
    const schedulerSync = syncScheduler(root);
    printJson(
      output && typeof output === "object" && !Array.isArray(output)
        ? { ...output, scheduler_sync: schedulerSync }
        : { helper: output, scheduler_sync: schedulerSync },
    );
    return;
  }

  if (helperResult.stdout) process.stdout.write(helperResult.stdout);
  if (helperResult.stderr) process.stderr.write(helperResult.stderr);
}

try {
  main();
} catch (error) {
  printJson({ error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 2;
}
