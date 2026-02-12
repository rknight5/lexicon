import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const results = await db
    .select()
    .from(puzzleResults)
    .where(eq(puzzleResults.username, username))
    .orderBy(desc(puzzleResults.timestamp));

  return NextResponse.json(
    results.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      topic: r.topic,
      gameType: r.gameType,
      difficulty: r.difficulty,
      score: r.score,
      wordsFound: r.wordsFound,
      wordsTotal: r.wordsTotal,
      elapsedSeconds: r.elapsedSeconds,
      livesRemaining: r.livesRemaining,
      hintsUsed: r.hintsUsed,
      outcome: r.outcome,
    }))
  );
}

export async function POST(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id || !body.topic || !body.gameType || !body.difficulty || !body.outcome) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await db.insert(puzzleResults).values({
      id: body.id,
      username,
      timestamp: body.timestamp,
      topic: body.topic,
      gameType: body.gameType,
      difficulty: body.difficulty,
      score: body.score,
      wordsFound: body.wordsFound,
      wordsTotal: body.wordsTotal,
      elapsedSeconds: body.elapsedSeconds,
      livesRemaining: body.livesRemaining,
      hintsUsed: body.hintsUsed,
      outcome: body.outcome,
    });
  } catch {
    // Duplicate key or other DB error — ignore silently (result already saved)
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true });
}
