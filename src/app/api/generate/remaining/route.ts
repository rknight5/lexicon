import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { generationLog, DAILY_GENERATION_LIMIT } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET() {
  try {
    const username = await requireAuth();

    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(generationLog)
      .where(
        and(
          eq(generationLog.username, username),
          gte(generationLog.createdAt, todayUtc)
        )
      );

    return NextResponse.json({
      remaining: DAILY_GENERATION_LIMIT - count,
      limit: DAILY_GENERATION_LIMIT,
    });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
