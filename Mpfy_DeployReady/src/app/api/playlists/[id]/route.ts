import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { playlistTracks, playlists } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import type { Playlist, Track } from "@/types/music";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function sanitize(s: string, max: number): string {
  return s.replace(/[<>]/g, "").trim().slice(0, max);
}

async function findOwned(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return { res: Response.json({ error: "Sign in to manage playlists." }, { status: 401 }) };
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return { res: Response.json({ error: "Invalid playlist id." }, { status: 400 }) };
  const rows = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, numId))
    .limit(1);
  const pl = rows[0];
  if (!pl) return { res: Response.json({ error: "Playlist not found." }, { status: 404 }) };
  if (pl.userId !== userId) return { res: Response.json({ error: "Not your playlist." }, { status: 403 }) };
  return { pl };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const found = await findOwned(id);
  if (found.res) return found.res;
  const pl = found.pl!;
  const tracks = await db
    .select()
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, pl.id))
    .orderBy(asc(playlistTracks.position));
  const playlist: Playlist = {
    id: String(pl.id),
    name: pl.name,
    description: pl.description ?? undefined,
    accent: pl.accent,
    owner: "user",
    tracks: tracks.map((t) => t.track),
  };
  playlist.trackCount = playlist.tracks.length;
  playlist.cover = playlist.tracks[0]?.artwork;
  return Response.json({ playlist });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const found = await findOwned(id);
  if (found.res) return found.res;
  const pl = found.pl!;
  let body: { name?: unknown; description?: unknown; tracks?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const updates: { name?: string; description?: string | null; updatedAt?: Date } = {};
  if (typeof body.name === "string") {
    const name = sanitize(body.name, 60);
    if (!name) return Response.json({ error: "Playlist needs a name." }, { status: 400 });
    updates.name = name;
  }
  if (typeof body.description === "string") updates.description = sanitize(body.description, 200) || null;

  if (Array.isArray(body.tracks)) {
    const tracks = body.tracks.filter(
      (t): t is Track =>
        Boolean(t) && typeof t === "object" && typeof (t as Track).videoId === "string" && typeof (t as Track).title === "string"
    );
    if (tracks.length > 1000) return Response.json({ error: "Playlists are limited to 1000 songs." }, { status: 400 });
    await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, pl.id));
    if (tracks.length > 0) {
      await db.insert(playlistTracks).values(
        tracks.map((t, i) => ({ playlistId: pl.id, position: i, track: t }))
      );
    }
    updates.updatedAt = new Date();
  }
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = updates.updatedAt ?? new Date();
    await db.update(playlists).set(updates).where(eq(playlists.id, pl.id));
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const found = await findOwned(id);
  if (found.res) return found.res;
  const pl = found.pl!;
  await db.delete(playlists).where(eq(playlists.id, pl.id));
  return Response.json({ ok: true });
}
