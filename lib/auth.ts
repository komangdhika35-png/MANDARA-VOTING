import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";

const SESSION_COOKIE = "suara-mandara-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(nis: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  getDatabase()
    .prepare("INSERT INTO sessions (token_hash, nis, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), nis, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function createAdminSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  getDatabase()
    .prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)")
    .run(hashToken(token), expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const session = getDatabase()
    .prepare("SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?")
    .get(hashToken(token), Math.floor(Date.now() / 1000));

  return Boolean(session);
}

export async function getSessionVoter() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const database = getDatabase();
  const voter = database
    .prepare(
      `SELECT voters.nis, voters.name
       FROM sessions
       JOIN voters ON voters.nis = sessions.nis
       WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND voters.active = 1`,
    )
    .get(hashToken(token), Math.floor(Date.now() / 1000)) as
    | { nis: string; name: string }
    | undefined;

  return voter ?? null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const database = getDatabase();
    database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    database.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(hashToken(token));
  }

  cookieStore.delete(SESSION_COOKIE);
}
