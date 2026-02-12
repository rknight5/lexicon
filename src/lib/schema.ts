import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow(),
});
