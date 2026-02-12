import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { autoSaves } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const [save] = await db
      .select()
      .from(autoSaves)
      .where(eq(autoSaves.username, username));

    if (!save) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      gameType: save.gameType,
      title: save.title,
      difficulty: save.difficulty,
      puzzleData: JSON.parse(save.puzzleData),
      gameState: JSON.parse(save.gameState),
      updatedAt: save.updatedAt,
    });
  } catch (err) {
    console.error("Failed to fetch auto-save:", err);
    return NextResponse.json({ error: "Failed to fetch auto-save" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.gameType || !body.title || !body.difficulty || !body.puzzleData || !body.gameState) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
        gameType: body.gameType,
        title: body.title,
        difficulty: body.difficulty,
        puzzleData,
        gameState,
      })
      .onConflictDoUpdate({
        target: autoSaves.username,
        set: {
          gameType: body.gameType,
          title: body.title,
          difficulty: body.difficulty,
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

export async function DELETE() {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await db
      .delete(autoSaves)
      .where(eq(autoSaves.username, username));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete auto-save:", err);
    return NextResponse.json({ error: "Failed to delete auto-save" }, { status: 500 });
  }
}
