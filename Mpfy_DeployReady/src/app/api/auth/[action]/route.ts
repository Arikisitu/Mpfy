import { randomInt, createHash } from "crypto";
import { NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { history, likes, playlistTracks, playlists, resetRequests, users } from "@/db/schema";
import {
  createSessionToken,
  getCurrentUser,
  hashPassword,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import { isValidEmail } from "@/lib/utils";
import type { GuestImport, Track } from "@/types/music";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ action: string }> };

function sanitize(s: string, max: number): string {
  return s.replace(/[<>]/g, "").trim().slice(0, max);
}

async function applyGuestImport(userId: number, imp?: GuestImport) {
  if (!imp) return;
  const likelist = Array.isArray(imp.likes) ? imp.likes.slice(0, 500) : [];
  if (likelist.length > 0) {
    await db
      .insert(likes)
      .values(likelist.map((t: Track) => ({ userId, videoId: t.videoId, track: t })))
      .onConflictDoNothing();
  }
  const hist = Array.isArray(imp.history) ? imp.history.slice(0, 100) : [];
  if (hist.length > 0) {
    await db.insert(history).values(hist.map((t: Track) => ({ userId, videoId: t.videoId, track: t })));
  }
  const pls = Array.isArray(imp.playlists) ? imp.playlists.slice(0, 50) : [];
  for (const p of pls) {
    const [row] = await db
      .insert(playlists)
      .values({ userId, name: sanitize(p.name ?? "Playlist", 60), description: p.description ? sanitize(p.description, 200) : null })
      .returning({ id: playlists.id });
    if (row && Array.isArray(p.tracks) && p.tracks.length > 0) {
      await db.insert(playlistTracks).values(
        p.tracks.slice(0, 1000).map((t: Track, i: number) => ({ playlistId: row.id, position: i, track: t }))
      );
    }
  }
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { action } = await params;
  if (action === "me") {
    const user = await getCurrentUser();
    return Response.json({ user });
  }
  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  const ip = ipFromRequest(req);
  const body = await readBody(req);

  try {
    switch (action) {
      case "signup": {
        if (!rateLimit(`signup:${ip}`, 8, 60_000))
          return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
        const email = sanitize(String(body.email ?? ""), 120).toLowerCase();
        const name = sanitize(String(body.name ?? ""), 40);
        const password = String(body.password ?? "");
        if (!isValidEmail(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
        if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 400 });
        if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) return Response.json({ error: "An account with this email already exists." }, { status: 409 });
        const [row] = await db
          .insert(users)
          .values({ email, name, passwordHash: hashPassword(password) })
          .returning({ id: users.id });
        await applyGuestImport(row.id, body.import as GuestImport | undefined);
        const token = await createSessionToken(row.id);
        const res = NextResponse.json({ user: { id: row.id, email, name } });
        res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
        return res;
      }
      case "login": {
        if (!rateLimit(`login:${ip}`, 12, 60_000))
          return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
        const email = sanitize(String(body.email ?? ""), 120).toLowerCase();
        const password = String(body.password ?? "");
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const u = rows[0];
        if (!u || !verifyPassword(password, u.passwordHash))
          return Response.json({ error: "Incorrect email or password." }, { status: 401 });
        await applyGuestImport(u.id, body.import as GuestImport | undefined);
        const token = await createSessionToken(u.id);
        const res = NextResponse.json({ user: { id: u.id, email: u.email, name: u.name } });
        res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
        return res;
      }
      case "logout": {
        const res = NextResponse.json({ ok: true });
        res.cookies.set(SESSION_COOKIE.name, "", SESSION_COOKIE.clearOptions);
        return res;
      }
      case "reset-request": {
        if (!rateLimit(`reset:${ip}`, 5, 60_000))
          return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
        const email = sanitize(String(body.email ?? ""), 120).toLowerCase();
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const u = rows[0];
        if (!u) return Response.json({ ok: true, demo: false });
        const code = String(randomInt(100000, 999999));
        const codeHash = createHash("sha256").update(code).digest("hex");
        await db.insert(resetRequests).values({
          userId: u.id,
          codeHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        // No SMTP provider is configured in this environment, so the code is
        // returned to the client in demo mode. With SMTP configured, email it.
        const smtpConfigured = Boolean(process.env.SMTP_URL);
        if (!smtpConfigured) {
          return Response.json({ ok: true, demo: true, demoCode: code });
        }
        return Response.json({ ok: true, demo: false });
      }
      case "reset-confirm": {
        if (!rateLimit(`reset:${ip}`, 10, 60_000))
          return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
        const email = sanitize(String(body.email ?? ""), 120).toLowerCase();
        const code = String(body.code ?? "");
        const password = String(body.password ?? "");
        if (password.length < 8)
          return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        const codeHash = createHash("sha256").update(code).digest("hex");
        const usersRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const u = usersRows[0];
        if (!u) return Response.json({ error: "Invalid or expired reset code." }, { status: 400 });
        const reqs = await db
          .select()
          .from(resetRequests)
          .where(
            and(
              eq(resetRequests.userId, u.id),
              eq(resetRequests.codeHash, codeHash),
              eq(resetRequests.used, false),
              gt(resetRequests.expiresAt, new Date())
            )
          )
          .limit(1);
        const r = reqs[0];
        if (!r) return Response.json({ error: "Invalid or expired reset code." }, { status: 400 });
        await db.update(resetRequests).set({ used: true }).where(eq(resetRequests.id, r.id));
        await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, u.id));
        return Response.json({ ok: true });
      }
      default:
        return Response.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return Response.json({ error: "Authentication service error. Try again." }, { status: 500 });
  }
}
