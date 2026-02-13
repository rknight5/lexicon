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

  try {
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
  } catch (err) {
    console.error("Failed to fetch history:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
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

  if (!body.id || !body.topic || !body.gameType || !body.difficulty || !body.outcome) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await db.insert(puzzleResults).values({
      id: body.id as string,
      username,
      timestamp: body.timestamp as number,
      topic: body.topic as string,
      gameType: body.gameType as string,
      difficulty: body.difficulty as string,
      score: body.score as number,
      wordsFound: body.wordsFound as number,
      wordsTotal: body.wordsTotal as number,
      elapsedSeconds: body.elapsedSeconds as number,
      livesRemaining: body.livesRemaining as number,
      hintsUsed: body.hintsUsed as number,
      outcome: body.outcome as string,
    });
  } catch (err) {
    // Duplicate key (code 23505) is expected — result already saved
    const isDuplicate = err instanceof Error && "code" in err && (err as { code: string }).code === "23505";
    if (!isDuplicate) {
      console.error("Failed to save history:", err);
      return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
