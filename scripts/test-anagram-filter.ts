/**
 * Anagram Filter Retest
 *
 * Tests 5 topics × 2 difficulties (Medium, Hard) = 10 combos, concurrency 3.
 * Logs candidates, survived, filter survival rate.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-anagram-filter.ts
 */

import { suggestCategories, generateAnagramWords } from "../src/lib/claude";
import type { Difficulty } from "../src/lib/types";

const TOPICS = [
  "Flavors of Italy",
  "Ocean Life",
  "Marvel Universe",
  "Classic Movies",
  "Space Exploration",
];

const DIFFICULTIES: Difficulty[] = ["medium", "hard"];

interface TestResult {
  topic: string;
  difficulty: string;
  timeMs: number;
  apiCalls: number;
  candidates: number;
  survived: number;
  status: "PASS" | "FAIL";
  error?: string;
}

async function testCombo(
  topic: string,
  difficulty: Difficulty,
  categories: string[]
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await generateAnagramWords(topic, difficulty, categories) as Record<string, unknown>;
    const timeMs = Date.now() - start;
    return {
      topic,
      difficulty,
      timeMs,
      apiCalls: (result._attempts as number) ?? -1,
      candidates: (result._candidates as number) ?? -1,
      survived: (result._survived as number) ?? -1,
      status: "PASS",
    };
  } catch (err) {
    const timeMs = Date.now() - start;
    return {
      topic,
      difficulty,
      timeMs,
      apiCalls: -1,
      candidates: -1,
      survived: -1,
      status: "FAIL",
      error: err instanceof Error ? err.message.slice(0, 80) : String(err),
    };
  }
}

async function main() {
  console.log("Fetching categories for each topic...\n");

  const topicCategories = new Map<string, string[]>();
  for (const topic of TOPICS) {
    try {
      const cats = await suggestCategories(topic);
      const names = cats.slice(0, 3).map((c) => c.name);
      topicCategories.set(topic, names);
      console.log(`  ${topic}: [${names.join(", ")}]`);
    } catch (err) {
      console.log(`  ${topic}: FAILED — ${err instanceof Error ? err.message : err}`);
      topicCategories.set(topic, []);
    }
  }

  console.log("\nRunning 10 anagram tests (concurrency 3)...\n");

  const taskFns: (() => Promise<TestResult>)[] = [];
  for (const topic of TOPICS) {
    const categories = topicCategories.get(topic) ?? [];
    if (categories.length === 0) continue;
    for (const difficulty of DIFFICULTIES) {
      taskFns.push(() => testCombo(topic, difficulty, categories));
    }
  }

  // Run with concurrency pool of 3
  const allResults: TestResult[] = [];
  let idx = 0;
  async function worker() {
    while (idx < taskFns.length) {
      const i = idx++;
      allResults[i] = await taskFns[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, taskFns.length) }, () => worker()));

  // Print results table
  const tw = 20;
  const header = [
    "Topic".padEnd(tw),
    "Diff".padEnd(8),
    "Time".padStart(8),
    "API Calls".padStart(10),
    "Candidates".padStart(11),
    "Survived".padStart(9),
    "Status".padStart(7),
  ].join(" | ");
  const sep = "-".repeat(header.length);

  console.log(sep);
  console.log(header);
  console.log(sep);

  for (const r of allResults) {
    const row = [
      r.topic.slice(0, tw).padEnd(tw),
      r.difficulty.padEnd(8),
      `${r.timeMs}ms`.padStart(8),
      (r.apiCalls === -1 ? "?" : String(r.apiCalls)).padStart(10),
      (r.candidates === -1 ? "?" : String(r.candidates)).padStart(11),
      (r.survived === -1 ? "?" : String(r.survived)).padStart(9),
      r.status.padStart(7),
    ].join(" | ");
    console.log(row);
    if (r.error) {
      console.log(`  └─ ${r.error}`);
    }
  }
  console.log(sep);

  // Summary
  console.log("\n========== SUMMARY ==========\n");

  const passed = allResults.filter((r) => r.status === "PASS");
  const failed = allResults.filter((r) => r.status === "FAIL");
  console.log(`Total: ${passed.length}/${allResults.length} passed, ${failed.length} failed`);

  // Single API call rate
  const singleCall = passed.filter((r) => r.apiCalls === 1).length;
  const singlePct = passed.length > 0 ? Math.round((singleCall / passed.length) * 100) : 0;
  console.log(`Single API call: ${singleCall}/${passed.length} (${singlePct}%)`);

  // Average filter survival rate
  const withDiag = passed.filter((r) => r.candidates > 0 && r.survived > 0);
  if (withDiag.length > 0) {
    const avgSurvival = Math.round(
      (withDiag.reduce((s, r) => s + r.survived / r.candidates, 0) / withDiag.length) * 100
    );
    console.log(`Avg filter survival: ${avgSurvival}%`);
  }

  // Max time
  const slowest = allResults.reduce((a, b) => (a.timeMs > b.timeMs ? a : b));
  console.log(`Slowest: ${slowest.topic} / ${slowest.difficulty} — ${slowest.timeMs}ms`);

  // Criteria check
  const issues: string[] = [];
  if (failed.length > 0) issues.push(`${failed.length} test(s) failed`);
  if (singlePct < 90) issues.push(`Single API call rate ${singlePct}% below 90%`);
  const over15 = allResults.filter((r) => r.timeMs > 15000);
  if (over15.length > 0) {
    for (const r of over15) {
      issues.push(`${r.topic} / ${r.difficulty} took ${r.timeMs}ms (>15s)`);
    }
  }
  if (withDiag.length > 0) {
    const avgSurvival =
      withDiag.reduce((s, r) => s + r.survived / r.candidates, 0) / withDiag.length;
    if (avgSurvival < 0.7) issues.push(`Avg filter survival ${Math.round(avgSurvival * 100)}% below 70%`);
  }

  if (issues.length > 0) {
    console.log(`\nIssues:`);
    for (const i of issues) console.log(`  - ${i}`);
  } else {
    console.log(`\nAll criteria met.`);
  }
}

main().catch(console.error);
