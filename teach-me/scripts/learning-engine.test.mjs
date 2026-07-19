#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const engine = fileURLToPath(new URL("./learning-engine.mjs", import.meta.url));

function run(home, today, args) {
  const result = spawnSync(process.execPath, [engine, ...args], {
    encoding: "utf8",
    env: { ...process.env, TEACH_ME_HOME: home, TEACH_ME_TODAY: today },
  });
  const output = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  return { ...result, output };
}

function writeJson(directory, name, value) {
  const filePath = path.join(directory, name);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

test("selftest exercises deterministic FSRS transitions", () => {
  const result = spawnSync(process.execPath, [engine, "selftest"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
  assert.equal(output.scheduler, "fsrs-4.5");
});

test("proxies state writes, records replayable projections, and exposes a quiet due summary", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "teach-me-engine-test-"));
  const inputs = path.join(home, "inputs");
  fs.mkdirSync(inputs);

  try {
    assert.equal(run(home, "2026-07-17", ["init"]).status, 0);
    const topicFile = writeJson(inputs, "topic.json", {
      topic: "memory-demo",
      title: "Memory demo",
      goal: "Recall one concept",
      order: ["concept"],
      nodes: {
        concept: {
          claim: "Spacing changes the probability of later recall.",
          probe: "Why schedule a later retrieval?",
          rubric: ["connects spacing to later recall"],
          requires: [],
          transfer_probe: null,
          arbitrary: false,
          threshold: false,
        },
      },
    });
    assert.equal(run(home, "2026-07-17", ["add-topic", "--file", topicFile]).status, 0);

    const receiptFile = writeJson(inputs, "receipt.json", {
      receipt_id: "r_memory_demo_1",
      topic: "memory-demo",
      node: "concept",
      kind: "encode",
      production: "The delayed attempt strengthens and measures later recall.",
      confidence: 70,
      grade: "recalled",
      rubric_notes: "The relationship is explicit.",
      misconceptions: [],
      feedback_line: "You connected spacing to later recall.",
      grader: "tutor",
      source: "self",
    });
    const recorded = run(home, "2026-07-17", ["record", "--file", receiptFile]);
    assert.equal(recorded.status, 0, recorded.stderr);
    assert.equal(recorded.output.scheduler_sync.appended.length, 1);

    const replay = run(home, "2026-07-17", ["scheduler-replay", "--topic", "memory-demo"]);
    assert.equal(replay.status, 0, replay.stderr);
    const transition = replay.output.topics[0].transitions[0];
    assert.equal(transition.rating, "good");
    assert.equal(transition.before, null);
    assert.equal(transition.after.due, "2026-07-21");
    assert.equal(transition.engine_version, "1.0.0");

    const quiet = run(home, "2026-07-17", ["due-summary"]);
    assert.equal(quiet.output.silent, true);
    assert.equal(quiet.output.message, null);

    const due = run(home, "2026-07-21", ["due-summary"]);
    assert.equal(due.output.silent, false);
    assert.equal(due.output.total_due, 1);
    assert.match(due.output.message, /1 review due/);

    const doctor = run(home, "2026-07-21", ["doctor"]);
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.equal(doctor.output.ok, true);
    assert.equal(doctor.output.scheduler.warnings.length, 0);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
