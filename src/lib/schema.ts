import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const puzzleResults = pgTable("puzzle_results", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  timestamp: real("timestamp").notNull(),
  topic: text("topic").notNull(),
  gameType: text("game_type").notNull(),
  difficulty: text("difficulty").notNull(),
  score: integer("score").notNull(),
  wordsFound: integer("words_found").notNull(),
  wordsTotal: integer("words_total").notNull(),
  elapsedSeconds: integer("elapsed_seconds").notNull(),
  livesRemaining: integer("lives_remaining").notNull(),
  hintsUsed: integer("hints_used").notNull(),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedPuzzles = pgTable("saved_puzzles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  gameType: text("game_type").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  puzzleData: text("puzzle_data").notNull(),
  gameState: text("game_state"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const autoSaves = pgTable("auto_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  gameType: text("game_type").notNull(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(),
  puzzleData: text("puzzle_data").notNull(),
  gameState: text("game_state").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("auto_saves_username_game_type_idx").on(table.username, table.gameType),
]);

export const DAILY_GENERATION_LIMIT = 10;

export const generationLog = pgTable("generation_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  gameType: text("game_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seenTriviaQuestions = pgTable("seen_trivia_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  topicNormalized: text("topic_normalized").notNull(),
  questionText: text("question_text").notNull(),
  seenAt: timestamp("seen_at").defaultNow(),
}, (table) => [
  uniqueIndex("seen_trivia_username_topic_question_idx").on(
    table.username, table.topicNormalized, table.questionText
  ),
]);
