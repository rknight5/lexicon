import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { seenTriviaQuestions } from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const topic = request.nextUrl.searchParams.get("topic");
  if (!topic) {
    return NextResponse.json({ error: "Missing topic parameter" }, { status: 400 });
  }

  const normalized = normalizeTopic(topic);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const rows = await db
      .select({ questionText: seenTriviaQuestions.questionText })
      .from(seenTriviaQuestions)
      .where(
        and(
          eq(seenTriviaQuestions.username, username),
          eq(seenTriviaQuestions.topicNormalized, normalized),
          gte(seenTriviaQuestions.seenAt, thirtyDaysAgo)
        )
      );

    return NextResponse.json({ questions: rows.map(r => r.questionText) });
  } catch (err) {
    console.error("Failed to fetch seen trivia questions:", err);
    return NextResponse.json({ error: "Failed to fetch seen questions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { topic: string; questions: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.topic || !Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: "Missing topic or questions" }, { status: 400 });
  }

  const normalized = normalizeTopic(body.topic);
  const trimmedQuestions = body.questions.map(q => q.trim()).filter(q => q.length > 0);

  if (trimmedQuestions.length === 0) {
    return NextResponse.json({ success: true });
  }

  try {
    await db
      .insert(seenTriviaQuestions)
      .values(
        trimmedQuestions.map(q => ({
          username,
          topicNormalized: normalized,
          questionText: q,
        }))
      )
      .onConflictDoNothing({
        target: [
          seenTriviaQuestions.username,
          seenTriviaQuestions.topicNormalized,
          seenTriviaQuestions.questionText,
        ],
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save seen trivia questions:", err);
    return NextResponse.json({ error: "Failed to save seen questions" }, { status: 500 });
  }
}
