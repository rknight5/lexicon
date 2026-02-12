import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { savedPuzzles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

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

  return NextResponse.json(puzzles);
}

export async function POST(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.gameType || !body.title || !body.topic || !body.difficulty || !body.puzzleData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [puzzle] = await db.insert(savedPuzzles).values({
    username,
    gameType: body.gameType,
    title: body.title,
    topic: body.topic,
    difficulty: body.difficulty,
    puzzleData: typeof body.puzzleData === "string" ? body.puzzleData : JSON.stringify(body.puzzleData),
  }).returning({ id: savedPuzzles.id });

  return NextResponse.json({ id: puzzle.id });
}
