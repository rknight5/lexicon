import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { savedPuzzles } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const puzzles = await db
      .select({
        id: savedPuzzles.id,
        gameType: savedPuzzles.gameType,
        title: savedPuzzles.title,
        topic: savedPuzzles.topic,
        difficulty: savedPuzzles.difficulty,
        createdAt: savedPuzzles.createdAt,
      })
      .from(savedPuzzles)
      .where(eq(savedPuzzles.username, username))
      .orderBy(desc(savedPuzzles.createdAt));

    return NextResponse.json(
      puzzles.map((p) => ({
        id: p.id,
        gameType: p.gameType,
        title: p.title,
        topic: p.topic,
        difficulty: p.difficulty,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    console.error("Failed to list puzzles:", err);
    return NextResponse.json({ error: "Failed to list puzzles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.gameType || !body.title || !body.topic || !body.difficulty || !body.puzzleData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const gameType = body.gameType as string;
  const title = body.title as string;
  const topicVal = body.topic as string;
  const difficultyVal = body.difficulty as string;
  const puzzleDataStr = typeof body.puzzleData === "string" ? body.puzzleData : JSON.stringify(body.puzzleData);

  try {
    // Check for existing save with same user + gameType + title
    const [existing] = await db
      .select({ id: savedPuzzles.id })
      .from(savedPuzzles)
      .where(
        and(
          eq(savedPuzzles.username, username),
          eq(savedPuzzles.gameType, gameType),
          eq(savedPuzzles.title, title)
        )
      );

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }

    const [puzzle] = await db.insert(savedPuzzles).values({
      username,
      gameType,
      title,
      topic: topicVal,
      difficulty: difficultyVal,
      puzzleData: puzzleDataStr,
    }).returning({ id: savedPuzzles.id });

    return NextResponse.json({ id: puzzle.id });
  } catch (err) {
    console.error("Failed to save puzzle:", err);
    return NextResponse.json({ error: "Failed to save puzzle" }, { status: 500 });
  }
}
