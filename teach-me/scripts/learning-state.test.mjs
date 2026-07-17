#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./learning-state.mjs", import.meta.url));

function run(home, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      TEACH_ME_HOME: home,
      TEACH_ME_TODAY: "2026-07-17",
    },
  });
  const output = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  return { ...result, output };
}

function writeInput(directory, name, value) {
  const filePath = path.join(directory, name);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

test("persists mission context, evidence-linked milestones, and learner-authored references", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "teach-me-state-"));
  const inputs = path.join(root, "inputs");
  fs.mkdirSync(inputs);

  try {
    const topicFile = writeInput(inputs, "topic.json", {
      topic: "bayes-basics",
      title: "Bayes basics",
      goal: "Interpret a positive test",
      mission: {
        why: "Explain screening results at work",
        success: ["Explain why prevalence matters"],
        constraints: ["Use approved terminology"],
        out_of_scope: ["Continuous distributions"],
      },
      sources: [
        {
          title: "Screening guide",
          location: "./screening.md",
          use_for: "Approved terminology",
        },
      ],
      source_gaps: ["A primary communication guide"],
      order: ["base-rate"],
      nodes: {
        "base-rate": {
          claim: "A test updates a prior probability.",
          probe: "What role does prevalence play after a positive test?",
          rubric: ["identifies prevalence as the prior", "states that the test updates it"],
          requires: [],
          transfer_probe: "What plays the role of prevalence in fraud detection?",
          arbitrary: false,
          threshold: true,
        },
      },
    });
    const added = run(root, ["add-topic", "--file", topicFile]);
    assert.equal(added.status, 0, added.stderr);
    assert.equal(added.output.mission.why, "Explain screening results at work");
    assert.equal(added.output.sources, 1);
    assert.deepEqual(added.output.source_gaps, ["A primary communication guide"]);

    const replacement = JSON.parse(fs.readFileSync(topicFile, "utf8"));
    delete replacement.mission;
    delete replacement.sources;
    delete replacement.source_gaps;
    replacement.title = "Bayes foundations";
    const replacementFile = writeInput(inputs, "replacement-topic.json", replacement);
    const replaced = run(root, ["add-topic", "--file", replacementFile, "--replace"]);
    assert.equal(replaced.status, 0, replaced.stderr);
    assert.equal(replaced.output.mission.why, "Explain screening results at work");
    assert.equal(replaced.output.sources, 1);
    assert.deepEqual(replaced.output.source_gaps, ["A primary communication guide"]);
    const topicStatus = run(root, ["status", "--topic", "bayes-basics"]);
    assert.equal(topicStatus.output.source_ledger[0].use_for, "Approved terminology");

    const receiptFile = writeInput(inputs, "receipt.json", {
      receipt_id: "r_base_rate_recalled",
      topic: "bayes-basics",
      node: "base-rate",
      kind: "encode",
      production: "Prevalence supplies the prior, which the test result updates.",
      confidence: 80,
      grade: "recalled",
      rubric_notes: "Both criteria are explicit.",
      misconceptions: [],
      feedback_line: "You retained both the prior and the update relationship.",
      grader: "tutor",
      source: "self",
    });
    assert.equal(run(root, ["record", "--file", receiptFile]).status, 0);

    const toldReceiptFile = writeInput(inputs, "told-receipt.json", {
      receipt_id: "r_base_rate_told",
      topic: "bayes-basics",
      node: "base-rate",
      kind: "encode",
      production: "Prevalence supplies the prior, which the test result updates.",
      confidence: null,
      grade: "recalled",
      rubric_notes: "The answer was supplied rather than generated.",
      misconceptions: [],
      feedback_line: "This was told, so it is not recall evidence.",
      grader: "tutor",
      source: "told",
    });
    assert.equal(run(root, ["record", "--file", toldReceiptFile]).status, 0);

    const milestoneFile = writeInput(inputs, "milestone.json", {
      milestone_id: "m_base_rate_model",
      topic: "bayes-basics",
      kind: "demonstrated-understanding",
      summary: "The learner now treats prevalence as the prior.",
      evidence: "A cold answer stated both the prior and the update.",
      receipt_ids: ["r_base_rate_recalled"],
      implications: ["Proceed to likelihood ratios."],
      supersedes: [],
    });
    const milestone = run(root, ["milestone", "add", "--file", milestoneFile]);
    assert.equal(milestone.status, 0, milestone.stderr);
    assert.equal(milestone.output.applied, true);
    const repeatedMilestone = run(root, ["milestone", "add", "--file", milestoneFile]);
    assert.equal(repeatedMilestone.status, 0, repeatedMilestone.stderr);
    assert.equal(repeatedMilestone.output.applied, false);
    const milestones = run(root, ["milestone", "list", "--topic", "bayes-basics"]);
    assert.equal(milestones.output.active, 1);
    assert.equal(milestones.output.items[0].status, "active");

    const revisedMilestoneFile = writeInput(inputs, "revised-milestone.json", {
      milestone_id: "m_base_rate_transfer_ready",
      topic: "bayes-basics",
      kind: "demonstrated-understanding",
      summary: "The learner can now connect prevalence to the update step.",
      evidence: "The same cold production supports moving to a changed-context probe.",
      receipt_ids: ["r_base_rate_recalled"],
      implications: ["Use a transfer example next."],
      supersedes: ["m_base_rate_model"],
    });
    assert.equal(
      run(root, ["milestone", "add", "--file", revisedMilestoneFile]).status,
      0,
    );
    const revisedMilestones = run(root, ["milestone", "list", "--topic", "bayes-basics"]);
    assert.equal(revisedMilestones.output.count, 2);
    assert.equal(revisedMilestones.output.active, 1);
    assert.equal(revisedMilestones.output.items[0].status, "superseded");
    assert.equal(revisedMilestones.output.items[0].superseded_by, "m_base_rate_transfer_ready");

    const forkedMilestoneFile = writeInput(inputs, "forked-milestone.json", {
      milestone_id: "m_conflicting_successor",
      topic: "bayes-basics",
      kind: "demonstrated-understanding",
      summary: "A conflicting successor should not be accepted.",
      evidence: "This tries to supersede an inactive milestone.",
      receipt_ids: ["r_base_rate_recalled"],
      implications: [],
      supersedes: ["m_base_rate_model"],
    });
    const forkedMilestone = run(root, ["milestone", "add", "--file", forkedMilestoneFile]);
    assert.equal(forkedMilestone.status, 2);
    assert.match(forkedMilestone.output.error, /inactive milestone/);

    const invalidMilestoneFile = writeInput(inputs, "invalid-milestone.json", {
      milestone_id: "m_no_receipt",
      topic: "bayes-basics",
      kind: "corrected-misconception",
      summary: "Unsupported correction",
      evidence: "No settled evidence exists.",
      receipt_ids: [],
      implications: [],
      supersedes: [],
    });
    const invalidMilestone = run(root, ["milestone", "add", "--file", invalidMilestoneFile]);
    assert.equal(invalidMilestone.status, 2);
    assert.match(invalidMilestone.output.error, /at least 1 item/);

    const toldMilestoneFile = writeInput(inputs, "told-milestone.json", {
      milestone_id: "m_told_is_not_evidence",
      topic: "bayes-basics",
      kind: "demonstrated-understanding",
      summary: "A supplied answer must not become a demonstrated milestone.",
      evidence: "The production came from the tutor.",
      receipt_ids: ["r_base_rate_told"],
      implications: [],
      supersedes: [],
    });
    const toldMilestone = run(root, ["milestone", "add", "--file", toldMilestoneFile]);
    assert.equal(toldMilestone.status, 2);
    assert.match(toldMilestone.output.error, /requires at least one recalled receipt/);

    const referenceFile = writeInput(inputs, "reference.json", {
      topic: "bayes-basics",
      reference: "positive-test-checklist",
      title: "Positive test checklist",
      content: "1. Identify prevalence.\n2. Apply the test evidence to update it.",
      authorship: "learner-edited",
      receipt_ids: ["r_base_rate_recalled"],
    });
    const reference = run(root, ["reference", "add", "--file", referenceFile]);
    assert.equal(reference.status, 0, reference.stderr);
    assert.equal(reference.output.applied, true);
    const repeatedReference = run(root, ["reference", "add", "--file", referenceFile]);
    assert.equal(repeatedReference.status, 0, repeatedReference.stderr);
    assert.equal(repeatedReference.output.applied, false);
    const shown = run(root, [
      "reference",
      "show",
      "--topic",
      "bayes-basics",
      "--reference",
      "positive-test-checklist",
    ]);
    assert.equal(shown.output.authorship, "learner-edited");
    assert.match(shown.output.content, /Identify prevalence/);

    const toldReferenceFile = writeInput(inputs, "told-reference.json", {
      topic: "bayes-basics",
      reference: "told-answer",
      title: "Told answer",
      content: "This content was supplied by the tutor.",
      authorship: "learner-edited",
      receipt_ids: ["r_base_rate_told"],
    });
    const toldReference = run(root, ["reference", "add", "--file", toldReferenceFile]);
    assert.equal(toldReference.status, 2);
    assert.match(toldReference.output.error, /requires at least one recalled receipt/);

    const doctor = run(root, ["doctor"]);
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.equal(doctor.output.ok, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
