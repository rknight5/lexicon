import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { autoSaves } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const saves = await db
      .select()
      .from(autoSaves)
      .where(eq(autoSaves.username, username))
      .orderBy(desc(autoSaves.updatedAt));

    const results = [];
    for (const save of saves) {
      let puzzleData: unknown;
      let gameState: unknown;
      try {
        puzzleData = JSON.parse(save.puzzleData);
        gameState = JSON.parse(save.gameState);
      } catch {
        // Corrupted data — delete the record and skip
        console.error("Corrupted auto-save data for user:", username, "gameType:", save.gameType);
        await db.delete(autoSaves).where(and(eq(autoSaves.username, username), eq(autoSaves.gameType, save.gameType)));
        continue;
      }
      results.push({
        gameType: save.gameType,
        title: save.title,
        difficulty: save.difficulty,
        puzzleData,
        gameState,
        updatedAt: save.updatedAt,
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Failed to fetch auto-saves:", err);
    return NextResponse.json({ error: "Failed to fetch auto-saves" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

  if (!body.gameType || !body.title || !body.difficulty || !body.puzzleData || !body.gameState) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const gameType = body.gameType as string;
  const title = body.title as string;
  const difficultyVal = body.difficulty as string;
  const puzzleData = typeof body.puzzleData === "string"
    ? body.puzzleData
    : JSON.stringify(body.puzzleData);
  const gameState = typeof body.gameState === "string"
    ? body.gameState
    : JSON.stringify(body.gameState);

  try {
    await db
      .insert(autoSaves)
      .values({
        username,
        gameType,
        title,
        difficulty: difficultyVal,
        puzzleData,
        gameState,
      })
      .onConflictDoUpdate({
        target: [autoSaves.username, autoSaves.gameType],
        set: {
          title,
          difficulty: difficultyVal,
          puzzleData,
          gameState,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to upsert auto-save:", err);
    return NextResponse.json({ error: "Failed to save auto-save" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let gameType: string | undefined;
  try {
    const body = await request.json();
    gameType = body.gameType as string;
  } catch {
    // No body — fall through to delete all
  }

  try {
    if (gameType) {
      await db
        .delete(autoSaves)
        .where(and(eq(autoSaves.username, username), eq(autoSaves.gameType, gameType)));
    } else {
      // Fallback: delete all saves for user
      await db
        .delete(autoSaves)
        .where(eq(autoSaves.username, username));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete auto-save:", err);
    return NextResponse.json({ error: "Failed to delete auto-save" }, { status: 500 });
  }
}
