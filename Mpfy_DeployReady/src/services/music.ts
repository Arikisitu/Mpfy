/**
 * Music data service (server-side only).
 *
 * - If YOUTUBE_API_KEY is set, metadata comes from the official
 *   YouTube Data API v3 (search, channels, playlists, videos).
 * - Otherwise a curated local demo catalog is served.
 *
 * Playback ALWAYS happens client-side via YouTube's official IFrame
 * embed. This layer never extracts or proxies audio streams.
 */
import type {
  Album,
  AlbumDetail,
  Artist,
  ArtistDetail,
  HomeData,
  Playlist,
  PlaylistMeta,
  SearchResults,
  Track,
} from "@/types/music";
import { slugify, ytThumb } from "@/lib/utils";
import {
  demoAlbumDetail,
  demoArtistDetail,
  demoCuratedMeta,
  demoHome,
  demoPlaylistDetail,
  demoSearch,
} from "./catalog";

const KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = "https://www.googleapis.com/youtube/v3";

/* ---------------- tiny TTL cache ---------------- */
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

function cached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  return null;
}

function remember<T>(key: string, data: T): T {
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return data;
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YT_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", KEY!);
  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- mappers ---------------- */
// Minimal typings for the parts of the YouTube API we consume.
interface YTThumb {
  url?: string;
}
interface YTSnippet {
  title?: string;
  channelTitle?: string;
  channelId?: string;
  publishedAt?: string;
  thumbnails?: Record<string, YTThumb>;
}
interface YTItem {
  id?: { kind?: string; videoId?: string; channelId?: string; playlistId?: string } | string;
  snippet?: YTSnippet;
}

function pickThumb(t?: Record<string, YTThumb>): string | undefined {
  return t?.medium?.url || t?.high?.url || t?.default?.url;
}

function isoToSeconds(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
}

function mapSearchItem(item: YTItem): Track | Artist | PlaylistMeta | null {
  const snippet = item.snippet;
  if (!snippet) return null;
  const idObj = item.id;
  if (typeof idObj === "string") return null;
  const kind = idObj?.kind ?? "";
  if (kind.includes("video") && idObj?.videoId) {
    const videoId = idObj.videoId;
    return {
      id: `yt:${videoId}`,
      videoId,
      title: decodeEntities(snippet.title ?? "Untitled"),
      artist: snippet.channelTitle?.replace(/ - Topic$/i, "") ?? "Unknown artist",
      artistId: `ytc:${snippet.channelId ?? "unknown"}`,
      artwork: pickThumb(snippet.thumbnails) ?? ytThumb(videoId),
      artworkSmall: pickThumb(snippet.thumbnails) ?? ytThumb(videoId, "mq"),
      source: "ytapi",
    } satisfies Track;
  }
  if (kind.includes("channel") && idObj?.channelId) {
    return {
      id: `ytc:${idObj.channelId}`,
      name: snippet.channelTitle ?? snippet.title ?? "Artist",
      artwork: pickThumb(snippet.thumbnails),
      source: "ytapi",
    } satisfies Artist;
  }
  if (kind.includes("playlist") && idObj?.playlistId) {
    return {
      id: `ytp:${idObj.playlistId}`,
      name: decodeEntities(snippet.title ?? "Playlist"),
      description: snippet.channelTitle,
      cover: pickThumb(snippet.thumbnails),
      owner: "curated" as const,
    } satisfies PlaylistMeta;
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function ytSearch(
  q: string,
  type: "video" | "channel" | "playlist",
  max: number
): Promise<YTItem[]> {
  const cacheKey = `search:${type}:${q}:${max}`;
  const hit = cached<YTItem[]>(cacheKey);
  if (hit) return hit;
  const params: Record<string, string> = {
    part: "snippet",
    q,
    type,
    maxResults: String(max),
  };
  if (type === "video") {
    params.videoCategoryId = "10"; // Music
    params.videoEmbeddable = "true"; // only request embeddable videos
  }
  const data = await ytFetch<{ items: YTItem[] }>("search", params);
  return remember(cacheKey, data.items ?? []);
}

async function ytSearchTracks(q: string, max = 12): Promise<Track[]> {
  const items = await ytSearch(q, "video", max);
  return items.map(mapSearchItem).filter((x): x is Track => Boolean(x && "videoId" in x));
}

async function ytVideosMeta(videoIds: string[]): Promise<Map<string, { dur?: number; art?: string }>> {
  if (videoIds.length === 0) return new Map();
  const out = new Map<string, { dur?: number; art?: string }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const data = await ytFetch<{
      items: Array<{
        id: string;
        contentDetails?: { duration?: string };
        snippet?: YTSnippet;
      }>;
    }>("videos", { part: "contentDetails,snippet", id: chunk.join(","), maxResults: "50" });
    for (const v of data.items ?? []) {
      out.set(v.id, {
        dur: isoToSeconds(v.contentDetails?.duration),
        art: pickThumb(v.snippet?.thumbnails),
      });
    }
  }
  return out;
}

/* ---------------- public API ---------------- */

export async function getHome(): Promise<HomeData> {
  if (!KEY) return demoHome();
  try {
    const hit = cached<HomeData>("home");
    if (hit) return hit;
    const [trendingItems, freshItems, artistItems, playlistItems, forYouItems] =
      await Promise.all([
        ytSearch("official audio", "video", 12),
        ytSearch("new music", "video", 12),
        ytSearch("music", "channel", 10),
        ytSearch("top hits playlist", "playlist", 8),
        ytSearch("chill mix", "video", 10),
      ]);
    const toTracks = (items: YTItem[]) =>
      items.map(mapSearchItem).filter((x): x is Track => Boolean(x && "videoId" in x));
    const newReleaseAlbums: Album[] = toTracks(freshItems).map((t) => ({
      id: `alb:${slugify(t.title)}:${t.artistId}`,
      title: t.title,
      artist: t.artist,
      artistId: t.artistId,
      artwork: t.artwork,
      source: "ytapi",
    }));
    const home: HomeData = {
      hero: {
        eyebrow: "Featured today",
        title: "The Sound of Now",
        subtitle: "From YouTube Music catalogs",
        description: "Fresh releases and trending tracks, streamed through YouTube's official embed player.",
        artwork: toTracks(trendingItems)[0]?.artwork,
        accent: 14,
        tracks: toTracks(trendingItems).slice(0, 8),
      },
      trending: toTracks(trendingItems),
      newReleases: newReleaseAlbums,
      topArtists: artistItems
        .map(mapSearchItem)
        .filter((x): x is Artist => Boolean(x && "id" in x && "name" in x)),
      curatedPlaylists: playlistItems
        .map(mapSearchItem)
        .filter((x): x is PlaylistMeta => Boolean(x && "id" in x && "name" in x)),
      forYou: toTracks(forYouItems),
      mode: "ytapi",
    };
    return remember("home", home);
  } catch {
    return demoHome(); // graceful degradation
  }
}

export async function searchAll(q: string): Promise<SearchResults> {
  const query = q.trim();
  if (!KEY) return demoSearch(query);
  try {
    const [tracks, artistItems, playlistItems] = await Promise.all([
      ytSearchTracks(query, 12),
      ytSearch(query, "channel", 6),
      ytSearch(query, "playlist", 6),
    ]);
    const artists = artistItems
      .map(mapSearchItem)
      .filter((x): x is Artist => Boolean(x && "name" in x));
    const playlists = playlistItems
      .map(mapSearchItem)
      .filter((x): x is PlaylistMeta => Boolean(x && "name" in x));
    // Derive "albums" from track titles' parent channels when possible.
    const albumMap = new Map<string, Album>();
    for (const t of tracks) {
      const key = `${t.artistId}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: `alb:${slugify(t.title)}:${t.artistId}`,
          title: t.title,
          artist: t.artist,
          artistId: t.artistId,
          artwork: t.artwork,
          source: "ytapi",
        });
      }
    }
    return { query, tracks, artists, albums: [...albumMap.values()].slice(0, 8), playlists, mode: "ytapi" };
  } catch {
    const demo = demoSearch(query);
    return demo;
  }
}

export async function getAlbumDetail(id: string): Promise<AlbumDetail | null> {
  if (!KEY || id.startsWith("alb:") || !id.startsWith("yt")) {
    return demoAlbumDetail(id);
  }
  try {
    // For YT-API mode, album pages resolve by searching the album title.
    const title = id.replace(/^yalb:/, "").replace(/-/g, " ");
    const tracks = await ytSearchTracks(title, 12);
    if (tracks.length === 0) return null;
    const first = tracks[0];
    return {
      id,
      title,
      artist: first.artist,
      artistId: first.artistId,
      artwork: first.artwork,
      tracks,
      source: "ytapi",
    };
  } catch {
    return null;
  }
}

export async function getArtistDetail(id: string): Promise<ArtistDetail | null> {
  if (!KEY || !id.startsWith("ytc:")) return demoArtistDetail(id.replace(/^ytc:/, ""));
  try {
    const channelId = id.slice(4);
    const cacheKey = `artist:${channelId}`;
    const hit = cached<ArtistDetail>(cacheKey);
    if (hit) return hit;
    const [chan, uploads] = await Promise.all([
      ytFetch<{
        items: Array<{ snippet?: YTSnippet; statistics?: { subscriberCount?: string } }>;
      }>("channels", { part: "snippet", id: channelId }),
      ytSearch("", "video", 12).catch(() => [] as YTItem[]),
    ]);
    const info = chan.items?.[0];
    // Search by channel name for top tracks (Data API cannot list uploads directly).
    const name = info?.snippet?.title ?? "Artist";
    const tracks = await ytSearchTracks(`${name} official audio`, 12);
    const detail: ArtistDetail = {
      id,
      name,
      bio: undefined,
      artwork: pickThumb(info?.snippet?.thumbnails),
      source: "ytapi",
      topTracks: tracks,
      albums: tracks.slice(0, 6).map((t) => ({
        id: `alb:${slugify(t.title)}:${t.artistId}`,
        title: t.title,
        artist: t.artist,
        artistId: t.artistId,
        artwork: t.artwork,
        source: "ytapi",
      })),
      singles: [],
      related: (
        await ytSearch(name, "channel", 7).catch(() => [] as YTItem[])
      )
        .map(mapSearchItem)
        .filter((x): x is Artist => Boolean(x && "name" in x && (x as Artist).id !== id))
        .slice(0, 6),
    };
    void uploads;
    return remember(cacheKey, detail);
  } catch {
    return null;
  }
}

export async function getPlaylistDetail(id: string): Promise<Playlist | null> {
  if (id.startsWith("c_") || !KEY) return demoPlaylistDetail(id);
  if (!id.startsWith("ytp:")) return null;
  try {
    const playlistId = id.slice(4);
    const cacheKey = `pl:${playlistId}`;
    const hit = cached<Playlist>(cacheKey);
    if (hit) return hit;
    const [meta, itemsData] = await Promise.all([
      ytFetch<{ items: Array<{ snippet?: YTSnippet }> }>("playlists", {
        part: "snippet",
        id: playlistId,
      }),
      ytFetch<{ items: Array<{ snippet?: YTSnippet & { resourceId?: { videoId?: string } } }> }>(
        "playlistItems",
        { part: "snippet", playlistId, maxResults: "50" }
      ),
    ]);
    const videoIds = (itemsData.items ?? [])
      .map((i) => i.snippet?.resourceId?.videoId)
      .filter((v): v is string => Boolean(v));
    const metas = await ytVideosMeta(videoIds);
    const tracks: Track[] = (itemsData.items ?? [])
      .map((i): Track | null => {
        const vid = i.snippet?.resourceId?.videoId;
        if (!vid) return null;
        const m = metas.get(vid);
        const title = decodeEntities(i.snippet?.title ?? "Untitled");
        if (/deleted video|private video/i.test(title)) return null;
        return {
          id: `yt:${vid}`,
          videoId: vid,
          title,
          artist: i.snippet?.channelTitle ?? i.snippet?.channelId ?? "Unknown",
          artistId: `ytc:${i.snippet?.channelId ?? "unknown"}`,
          artwork: m?.art ?? ytThumb(vid),
          artworkSmall: m?.art ?? ytThumb(vid, "mq"),
          durationSec: m?.dur,
          source: "ytapi" as const,
        };
      })
      .filter((t): t is Track => Boolean(t));
    const pl: Playlist = {
      id,
      name: decodeEntities(meta.items?.[0]?.snippet?.title ?? "Playlist"),
      description: meta.items?.[0]?.snippet?.channelTitle,
      owner: "curated",
      trackCount: tracks.length,
      cover: tracks[0]?.artwork,
      tracks,
    };
    return remember(cacheKey, pl);
  } catch {
    return null;
  }
}

export function curatedPlaylistsMeta(): PlaylistMeta[] {
  return demoCuratedMeta();
}
