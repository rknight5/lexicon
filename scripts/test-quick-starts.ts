/**
 * Quick Start Topic Evaluator
 *
 * Tests all 6 quick-start topics across 4 game types × 3 difficulties = 12 combos each.
 * Topics run sequentially; combos within a topic run with limited concurrency (3 at a time)
 * to avoid API rate limits.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-quick-starts.ts
 */

import { suggestCategories, generatePuzzleWords, generateCrosswordWords, generateAnagramWords, generateTriviaQuestions } from "../src/lib/claude";
import type { Difficulty } from "../src/lib/types";

const TOPICS = [
  "Classic Movies",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Ocean Life",
  "Space Exploration",
];

const GAME_TYPES = ["wordsearch", "crossword", "anagram", "trivia"] as const;
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const HEADERS = [
  "WS-E", "WS-M", "WS-H",
  "CW-E", "CW-M", "CW-H",
  "AN-E", "AN-M", "AN-H",
  "TV-E", "TV-M", "TV-H",
];

type Result = "✓" | "✗" | "T"; // pass, fail, timeout

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/** Run promises with max concurrency */
async function pool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

async function testGeneration(
  gameType: typeof GAME_TYPES[number],
  topic: string,
  difficulty: Difficulty,
  categories: string[],
  label: string,
): Promise<{ result: Result; error?: string }> {
  try {
    if (gameType === "wordsearch") {
      await withTimeout(generatePuzzleWords(topic, difficulty, categories), 15000);
    } else if (gameType === "crossword") {
      await withTimeout(generateCrosswordWords(topic, difficulty, categories), 15000);
    } else if (gameType === "anagram") {
      await withTimeout(generateAnagramWords(topic, difficulty, categories), 15000);
    } else {
      await withTimeout(generateTriviaQuestions(topic, difficulty, categories), 15000);
    }
    process.stdout.write(`    ${label} ✓\n`);
    return { result: "✓" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "TIMEOUT") {
      process.stdout.write(`    ${label} T (timeout)\n`);
      return { result: "T", error: "timeout" };
    }
    process.stdout.write(`    ${label} ✗ ${msg.slice(0, 60)}\n`);
    return { result: "✗", error: msg.slice(0, 80) };
  }
}

async function testTopic(topic: string): Promise<{ topic: string; results: Result[]; errors: string[] }> {
  console.log(`\n⏳ ${topic}`);

  // Step 1: get categories
  let categories: string[];
  try {
    const cats = await withTimeout(suggestCategories(topic), 15000);
    categories = cats.slice(0, 3).map((c) => c.name);
    if (categories.length < 2) {
      console.log(`  ⚠️  Only ${categories.length} categories returned`);
      return {
        topic,
        results: Array(12).fill("✗") as Result[],
        errors: [`Only ${categories.length} categories returned`],
      };
    }
    console.log(`  Categories: [${categories.join(", ")}]`);
  } catch (err) {
    console.log(`  ❌ Categories failed: ${err instanceof Error ? err.message : String(err)}`);
    return {
      topic,
      results: Array(12).fill("✗") as Result[],
      errors: [`Categories failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  // Step 2: run 12 combos sequentially (avoids rate limits from internal retries)
  const combos: { gameType: typeof GAME_TYPES[number]; difficulty: Difficulty; label: string }[] = [];
  for (const gt of GAME_TYPES) {
    for (const d of DIFFICULTIES) {
      const idx = combos.length;
      combos.push({ gameType: gt, difficulty: d, label: HEADERS[idx] });
    }
  }

  const outcomes: { result: Result; error?: string }[] = [];
  for (const c of combos) {
    outcomes.push(await testGeneration(c.gameType, topic, c.difficulty, categories, c.label));
    // Small delay to avoid rate limit pressure from internal retries
    await new Promise((r) => setTimeout(r, 1000));
  }

  const results = outcomes.map((o) => o.result);
  const errors = outcomes
    .map((o, i) => (o.error ? `${HEADERS[i]}: ${o.error}` : null))
    .filter(Boolean) as string[];

  const passes = results.filter((r) => r === "✓").length;
  console.log(`  Result: ${passes}/12 passed`);

  return { topic, results, errors };
}

async function main() {
  console.log("Testing quick-start topics (3 concurrent per topic, topics sequential)...");

  // Run topics sequentially to avoid rate limits
  const allResults: { topic: string; results: Result[]; errors: string[] }[] = [];
  for (const topic of TOPICS) {
    allResults.push(await testTopic(topic));
  }

  // Print table
  const topicWidth = Math.max(...TOPICS.map((t) => t.length), 18);
  const colWidth = 6;

  const header = "Topic".padEnd(topicWidth) + " | " + HEADERS.map((h) => h.padStart(colWidth)).join(" | ");
  const separator = "-".repeat(header.length);

  console.log("\n" + separator);
  console.log(header);
  console.log(separator);

  for (const { topic, results } of allResults) {
    const row = topic.padEnd(topicWidth) + " | " + results.map((r) => r.padStart(colWidth)).join(" | ");
    console.log(row);
  }
  console.log(separator);

  console.log("\n✓ = pass, ✗ = fail, T = timeout (15s)\n");

  // Flag topics with 3+ failures
  const flagged: string[] = [];
  for (const { topic, results, errors } of allResults) {
    const failures = results.filter((r) => r !== "✓").length;
    if (failures >= 3) {
      flagged.push(topic);
    }
    if (errors.length > 0) {
      console.log(`${topic} errors:`);
      for (const e of errors) {
        console.log(`  - ${e}`);
      }
    }
  }

  if (flagged.length > 0) {
    console.log(`\n⚠️  Topics flagged for replacement (3+ failures): ${flagged.join(", ")}`);
  } else {
    console.log("\n✅ All topics passed with fewer than 3 failures.");
  }
}

main().catch(console.error);
