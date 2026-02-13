import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const USERNAME_MAX = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

export async function POST(request: NextRequest) {
  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.username || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (name.length > USERNAME_MAX) {
    return NextResponse.json({ error: `Name must be ${USERNAME_MAX} characters or fewer` }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(name)) {
    return NextResponse.json({ error: "Name can only contain letters, numbers, spaces, hyphens, and underscores" }, { status: 400 });
  }

  try {
    await db.insert(users).values({ username: name }).onConflictDoNothing();

    const session = await getSession();
    session.authenticated = true;
    session.username = name;
    await session.save();
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Couldn't log in — please try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, username: name });
}
