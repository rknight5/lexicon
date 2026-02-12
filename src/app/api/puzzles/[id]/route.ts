import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { savedPuzzles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const [puzzle] = await db
      .select()
      .from(savedPuzzles)
      .where(and(eq(savedPuzzles.id, id), eq(savedPuzzles.username, username)));

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: puzzle.id,
      gameType: puzzle.gameType,
      title: puzzle.title,
      topic: puzzle.topic,
      difficulty: puzzle.difficulty,
      puzzleData: JSON.parse(puzzle.puzzleData),
      gameState: puzzle.gameState ? JSON.parse(puzzle.gameState) : null,
      createdAt: puzzle.createdAt,
    });
  } catch (err) {
    console.error("Failed to load puzzle:", err);
    return NextResponse.json({ error: "Failed to load puzzle" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const [existing] = await db
      .select({ id: savedPuzzles.id })
      .from(savedPuzzles)
      .where(and(eq(savedPuzzles.id, id), eq(savedPuzzles.username, username)));

    if (!existing) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const gameStateValue = body.gameState === null
      ? null
      : typeof body.gameState === "string"
        ? body.gameState
        : JSON.stringify(body.gameState);

    await db
      .update(savedPuzzles)
      .set({ gameState: gameStateValue })
      .where(eq(savedPuzzles.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update puzzle state:", err);
    return NextResponse.json({ error: "Failed to update puzzle state" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await db
      .delete(savedPuzzles)
      .where(and(eq(savedPuzzles.id, id), eq(savedPuzzles.username, username)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete puzzle:", err);
    return NextResponse.json({ error: "Failed to delete puzzle" }, { status: 500 });
  }
}
