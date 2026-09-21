import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { history, likes } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import type { Track } from "@/types/music";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kind: string }> };

async function authed(): Promise<{ userId: number } | Response> {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to sync your library." }, { status: 401 });
  return { userId };
}

function validTrack(t: unknown): t is Track {
  if (!t || typeof t !== "object") return false;
  const x = t as Record<string, unknown>;
  return typeof x.videoId === "string" && typeof x.title === "string" && x.videoId.length > 0;
}

export async function GET(_req: Request, { params }: Params) {
  const { kind } = await params;
  const a = await authed();
  if (a instanceof Response) return a;
  if (kind === "likes") {
    const rows = await db.select().from(likes).where(eq(likes.userId, a.userId)).orderBy(desc(likes.createdAt));
    return Response.json({ tracks: rows.map((r) => r.track) });
  }
  if (kind === "history") {
    const rows = await db
      .select()
      .from(history)
      .where(eq(history.userId, a.userId))
      .orderBy(desc(history.playedAt))
      .limit(100);
    return Response.json({ tracks: rows.map((r) => r.track) });
  }
  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: Request, { params }: Params) {
  const { kind } = await params;
  const a = await authed();
  if (a instanceof Response) return a;
  let body: { track?: unknown };
  try {
    body = (await req.json()) as { track?: unknown };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!validTrack(body.track)) return Response.json({ error: "Invalid track" }, { status: 400 });
  const track = body.track;

  if (kind === "likes") {
    await db
      .insert(likes)
      .values({ userId: a.userId, videoId: track.videoId, track })
      .onConflictDoNothing();
    return Response.json({ ok: true });
  }
  if (kind === "history") {
    await db.insert(history).values({ userId: a.userId, videoId: track.videoId, track });
    // cap history at 100 rows
    const rows = await db
      .select({ id: history.id })
      .from(history)
      .where(eq(history.userId, a.userId))
      .orderBy(desc(history.playedAt))
      .limit(200);
    if (rows.length > 100) {
      const ids = rows.slice(100).map((r) => r.id);
      await db.delete(history).where(inArray(history.id, ids));
    }
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { kind } = await params;
  const a = await authed();
  if (a instanceof Response) return a;
  if (kind === "likes") {
    let videoId = new URL(req.url).searchParams.get("videoId") ?? "";
    if (!videoId) {
      try {
        const b = (await req.json()) as { videoId?: string };
        videoId = b.videoId ?? "";
      } catch {
        /* ignore */
      }
    }
    if (!videoId) return Response.json({ error: "Missing videoId" }, { status: 400 });
    await db.delete(likes).where(and(eq(likes.userId, a.userId), eq(likes.videoId, videoId)));
    return Response.json({ ok: true });
  }
  if (kind === "history") {
    await db.delete(history).where(eq(history.userId, a.userId));
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Not found" }, { status: 404 });
}
