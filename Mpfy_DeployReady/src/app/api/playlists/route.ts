import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { playlistTracks, playlists } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import type { Playlist, Track } from "@/types/music";

export const dynamic = "force-dynamic";

function sanitize(s: string, max: number): string {
  return s.replace(/[<>]/g, "").trim().slice(0, max);
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ playlists: [] });
  const rows = await db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(asc(playlists.createdAt));
  const out: Playlist[] = rows.map((p) => ({
    id: String(p.id),
    name: p.name,
    description: p.description ?? undefined,
    accent: p.accent,
    owner: "user" as const,
    tracks: [],
  }));
  if (out.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      const t = await db
        .select()
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, rows[i].id))
        .orderBy(asc(playlistTracks.position));
      out[i].tracks = t.map((x) => x.track);
      out[i].trackCount = t.length;
      out[i].cover = t[0]?.track.artwork;
    }
  }
  return Response.json({ playlists: out });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Sign in to create synced playlists." }, { status: 401 });
  const ip = ipFromRequest(req);
  if (!rateLimit(`pl:${userId}:${ip}`, 20, 60_000))
    return Response.json({ error: "Too many playlists created. Slow down." }, { status: 429 });
  let body: { name?: unknown; description?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; description?: unknown };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const name = sanitize(String(body.name ?? ""), 60);
  if (name.length < 1) return Response.json({ error: "Playlist needs a name." }, { status: 400 });
  const description = body.description ? sanitize(String(body.description), 200) : null;
  const [row] = await db
    .insert(playlists)
    .values({ userId, name, description, accent: Math.floor(Math.random() * 360) })
    .returning();
  return Response.json({
    playlist: {
      id: String(row.id),
      name: row.name,
      description: row.description ?? undefined,
      accent: row.accent,
      owner: "user",
      tracks: [],
    } satisfies Playlist,
  });
}
