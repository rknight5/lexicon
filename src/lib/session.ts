import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  authenticated?: boolean;
  username?: string;
}

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET is required in production");
  process.exit(1);
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "lexicon-dev-secret-change-me-32ch",
  cookieName: "lexicon-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.authenticated || !session.username) {
    throw new Error("Authentication required");
  }
  return session.username;
}
