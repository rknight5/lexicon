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
    createdAt: puzzle.createdAt,
  });
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
  await db
    .delete(savedPuzzles)
    .where(and(eq(savedPuzzles.id, id), eq(savedPuzzles.username, username)));

  return NextResponse.json({ success: true });
}
