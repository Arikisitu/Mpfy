import {
  curatedPlaylistsMeta,
  getAlbumDetail,
  getArtistDetail,
  getHome,
  getPlaylistDetail,
  searchAll,
} from "@/services/music";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kind: string }> };

export async function GET(req: Request, { params }: Params) {
  const { kind } = await params;
  const url = new URL(req.url);
  try {
    switch (kind) {
      case "home": {
        return Response.json(await getHome());
      }
      case "search": {
        const ip = ipFromRequest(req);
        if (!rateLimit(`search:${ip}`, 40, 60_000)) {
          return Response.json({ error: "Too many searches — take a breath and try again." }, { status: 429 });
        }
        const q = url.searchParams.get("q") ?? "";
        if (!q.trim()) {
          return Response.json({ query: "", tracks: [], artists: [], albums: [], playlists: [], mode: "demo" });
        }
        return Response.json(await searchAll(q));
      }
      case "album": {
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing album id" }, { status: 400 });
        const album = await getAlbumDetail(id);
        if (!album) return Response.json({ error: "Album not found" }, { status: 404 });
        return Response.json({ album });
      }
      case "artist": {
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing artist id" }, { status: 400 });
        const artist = await getArtistDetail(id);
        if (!artist) return Response.json({ error: "Artist not found" }, { status: 404 });
        return Response.json({ artist });
      }
      case "playlist": {
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing playlist id" }, { status: 400 });
        const playlist = await getPlaylistDetail(id);
        if (!playlist) return Response.json({ error: "Playlist not found" }, { status: 404 });
        return Response.json({ playlist });
      }
      case "curated": {
        return Response.json({ playlists: curatedPlaylistsMeta() });
      }
      default:
        return Response.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return Response.json({ error: "Mpfy's music service is temporarily unavailable." }, { status: 502 });
  }
}
