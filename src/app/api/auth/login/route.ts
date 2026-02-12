import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const USERNAME_MAX = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

export async function POST(request: NextRequest) {
  const { username } = await request.json();
  const name = (username || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (name.length > USERNAME_MAX) {
    return NextResponse.json({ error: `Name must be ${USERNAME_MAX} characters or fewer` }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(name)) {
    return NextResponse.json({ error: "Name can only contain letters, numbers, spaces, hyphens, and underscores" }, { status: 400 });
  }

  await db.insert(users).values({ username: name }).onConflictDoNothing();

  const session = await getSession();
  session.authenticated = true;
  session.username = name;
  await session.save();

  return NextResponse.json({ success: true, username: name });
}
