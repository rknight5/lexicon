/**
 * Full Generation Speed Test
 *
 * Tests 5 topics × 4 game types × 2 difficulties (Medium, Hard) = 40 combos in parallel.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-crossword-speed.ts
 */

import {
  suggestCategories,
  generatePuzzleWords,
  generateCrosswordWords,
  generateAnagramWords,
  generateTriviaQuestions,
} from "../src/lib/claude";
import type { Difficulty } from "../src/lib/types";

const TOPICS = [
  "Flavors of Italy",
  "Ocean Life",
  "Marvel Universe",
  "Classic Movies",
  "Space Exploration",
];

const GAME_TYPES = ["wordsearch", "crossword", "anagram", "trivia"] as const;
type GameType = (typeof GAME_TYPES)[number];
const DIFFICULTIES: Difficulty[] = ["medium", "hard"];

interface TestResult {
  topic: string;
  gameType: GameType;
  difficulty: string;
  timeMs: number;
  apiCalls: number;
  count: number; // words or questions
  status: "PASS" | "FAIL";
  error?: string;
}

async function testCombo(
  gameType: GameType,
  topic: string,
  difficulty: Difficulty,
  categories: string[]
): Promise<TestResult> {
  const start = Date.now();
  try {
    let result: { _attempts?: number; words?: unknown[]; questions?: unknown[] };
    if (gameType === "wordsearch") {
      result = await generatePuzzleWords(topic, difficulty, categories);
    } else if (gameType === "crossword") {
      result = await generateCrosswordWords(topic, difficulty, categories);
    } else if (gameType === "anagram") {
      result = await generateAnagramWords(topic, difficulty, categories);
    } else {
      result = await generateTriviaQuestions(topic, difficulty, categories);
    }
    const timeMs = Date.now() - start;
    const count = result.words?.length ?? (result.questions as unknown[])?.length ?? 0;
    return {
      topic,
      gameType,
      difficulty,
      timeMs,
      apiCalls: result._attempts ?? -1,
      count,
      status: "PASS",
    };
  } catch (err) {
    const timeMs = Date.now() - start;
    return {
      topic,
      gameType,
      difficulty,
      timeMs,
      apiCalls: -1,
      count: 0,
      status: "FAIL",
      error: err instanceof Error ? err.message.slice(0, 60) : String(err),
    };
  }
}

function printGroup(gameType: string, results: TestResult[]) {
  const label = gameType.toUpperCase();
  const topicWidth = 20;
  const header = [
    "Topic".padEnd(topicWidth),
    "Diff".padEnd(8),
    "Time".padStart(8),
    "API Calls".padStart(10),
    "Count".padStart(6),
    "Status".padStart(7),
  ].join(" | ");
  const separator = "-".repeat(header.length);

  console.log(`\n${label}`);
  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const r of results) {
    const row = [
      r.topic.slice(0, topicWidth).padEnd(topicWidth),
      r.difficulty.padEnd(8),
      `${r.timeMs}ms`.padStart(8),
      (r.apiCalls === -1 ? "?" : String(r.apiCalls)).padStart(10),
      String(r.count).padStart(6),
      r.status.padStart(7),
    ].join(" | ");
    console.log(row);
    if (r.error) {
      console.log(`  └─ ${r.error}`);
    }
  }
  console.log(separator);
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

  console.log("\nRunning 40 generation tests (concurrency 5)...\n");

  const taskFns: (() => Promise<TestResult>)[] = [];
  for (const topic of TOPICS) {
    const categories = topicCategories.get(topic) ?? [];
    if (categories.length === 0) continue;
    for (const gameType of GAME_TYPES) {
      for (const difficulty of DIFFICULTIES) {
        taskFns.push(() => testCombo(gameType, topic, difficulty, categories));
      }
    }
  }

  // Run with concurrency pool of 5
  const allResults: TestResult[] = [];
  let idx = 0;
  async function worker() {
    while (idx < taskFns.length) {
      const i = idx++;
      allResults[i] = await taskFns[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, taskFns.length) }, () => worker()));

  // Print grouped tables
  for (const gt of GAME_TYPES) {
    const group = allResults.filter((r) => r.gameType === gt);
    printGroup(gt, group);
  }

  // Summary
  console.log("\n========== SUMMARY ==========\n");

  const passed = allResults.filter((r) => r.status === "PASS");
  const failed = allResults.filter((r) => r.status === "FAIL");
  console.log(`Total: ${passed.length}/${allResults.length} passed, ${failed.length} failed`);

  // Average time per game type
  for (const gt of GAME_TYPES) {
    const group = allResults.filter((r) => r.gameType === gt && r.status === "PASS");
    if (group.length === 0) {
      console.log(`  ${gt.toUpperCase()}: no passes`);
      continue;
    }
    const avg = Math.round(group.reduce((s, r) => s + r.timeMs, 0) / group.length);
    console.log(`  ${gt.toUpperCase()} avg: ${avg}ms`);
  }

  // Slowest test
  const slowest = allResults.reduce((a, b) => (a.timeMs > b.timeMs ? a : b));
  console.log(`\nSlowest: ${slowest.topic} / ${slowest.gameType} / ${slowest.difficulty} — ${slowest.timeMs}ms`);

  // Single API call rate
  const singleCall = passed.filter((r) => r.apiCalls === 1).length;
  const singlePct = passed.length > 0 ? Math.round((singleCall / passed.length) * 100) : 0;
  console.log(`Single API call: ${singleCall}/${passed.length} (${singlePct}%)`);

  // Criteria check
  const issues: string[] = [];
  if (failed.length > 0) issues.push(`${failed.length} test(s) failed`);
  for (const gt of GAME_TYPES) {
    const group = allResults.filter((r) => r.gameType === gt && r.status === "PASS");
    if (group.length === 0) continue;
    const avg = Math.round(group.reduce((s, r) => s + r.timeMs, 0) / group.length);
    if (avg > 8000) issues.push(`${gt.toUpperCase()} avg ${avg}ms exceeds 8000ms`);
  }
  const over15 = allResults.filter((r) => r.timeMs > 15000);
  if (over15.length > 0) {
    for (const r of over15) {
      issues.push(`${r.topic} / ${r.gameType} / ${r.difficulty} took ${r.timeMs}ms (>15s)`);
    }
  }
  if (singlePct < 80) issues.push(`Single API call rate ${singlePct}% below 80%`);

  if (issues.length > 0) {
    console.log(`\n⚠️  Issues:`);
    for (const i of issues) console.log(`  - ${i}`);
  } else {
    console.log(`\n✅ All criteria met.`);
  }

  // Flag specific failures for candidate count bumps
  if (failed.length > 0) {
    console.log(`\n📋 Failed combos (may need candidate count bump):`);
    for (const r of failed) {
      console.log(`  - ${r.gameType.toUpperCase()} ${r.difficulty}: ${r.topic} — ${r.error}`);
    }
  }
}

main().catch(console.error);
