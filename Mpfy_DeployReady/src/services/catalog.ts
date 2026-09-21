/**
 * Demo catalog — used when no YOUTUBE_API_KEY is configured.
 * Metadata is curated locally; all playback still happens through
 * YouTube's official embed player using real, public video ids.
 * Artwork is served from YouTube's public thumbnail endpoints.
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
import { hueFromString, slugify, ytThumb } from "@/lib/utils";

interface ArtistDef {
  id: string;
  name: string;
  bio: string;
}

interface TrackDef {
  videoId: string;
  title: string;
  artistId: string;
  album?: string;
  year: number;
  dur: number;
}

const ARTISTS: ArtistDef[] = [
  { id: "the-weeknd", name: "The Weeknd", bio: "Toronto artist who fused shadowy alternative R&B with stadium-sized synth-pop, becoming one of the defining voices of modern pop." },
  { id: "dua-lipa", name: "Dua Lipa", bio: "London singer and songwriter whose crisp disco-pop revival made her a global headline act." },
  { id: "ed-sheeran", name: "Ed Sheeran", bio: "British singer-songwriter known for loop-pedal folk-pop and some of the most streamed ballads of the last decade." },
  { id: "billie-eilish", name: "Billie Eilish", bio: "Vocalist and songwriter whose whisper-quiet, bass-heavy pop reshaped mainstream production as a teenager." },
  { id: "post-malone", name: "Post Malone", bio: "Genre-blurring artist mixing hip-hop, rock and pop melody into effortless radio hits." },
  { id: "coldplay", name: "Coldplay", bio: "London band that grew from piano-led indie anthems into one of the world's biggest live acts." },
  { id: "taylor-swift", name: "Taylor Swift", bio: "Songwriter who crossed from country to pop superstardom with sharply detailed storytelling." },
  { id: "daft-punk", name: "Daft Punk", bio: "French electronic duo whose robot mystique and meticulous production changed dance music forever." },
  { id: "arctic-monkeys", name: "Arctic Monkeys", bio: "Sheffield band whose sharp guitar pop matured into slow-burning, cinematic rock." },
  { id: "avicii", name: "Avicii", bio: "Swedish producer who bridged EDM and folk melody, leaving a lasting mark on festival music." },
  { id: "bruno-mars", name: "Bruno Mars", bio: "Singer, songwriter and producer reviving funk, soul and new jack swing with flawless showmanship." },
  { id: "queen", name: "Queen", bio: "Legendary British rock band fronted by Freddie Mercury, whose catalogue spans operatic rock anthems." },
];

const TRACKS: TrackDef[] = [
  { videoId: "4NRXx6U8ABQ", title: "Blinding Lights", artistId: "the-weeknd", album: "After Hours", year: 2020, dur: 222 },
  { videoId: "34Na4j8AVgA", title: "Starboy", artistId: "the-weeknd", album: "Starboy", year: 2016, dur: 230 },
  { videoId: "TUVcZfQe-Kw", title: "Levitating", artistId: "dua-lipa", album: "Future Nostalgia", year: 2020, dur: 203 },
  { videoId: "oygrmJ5YZyI", title: "Don't Start Now", artistId: "dua-lipa", album: "Future Nostalgia", year: 2019, dur: 183 },
  { videoId: "9HDEHj2yzew", title: "Physical", artistId: "dua-lipa", album: "Future Nostalgia", year: 2020, dur: 194 },
  { videoId: "JGwWNGJdvx8", title: "Shape of You", artistId: "ed-sheeran", album: "÷ (Divide)", year: 2017, dur: 234 },
  { videoId: "2Vv-BfVoq4g", title: "Perfect", artistId: "ed-sheeran", album: "÷ (Divide)", year: 2017, dur: 263 },
  { videoId: "DyDfgMOUjCI", title: "bad guy", artistId: "billie-eilish", album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?", year: 2019, dur: 194 },
  { videoId: "V1Pl5CzCzCw", title: "lovely (with Khalid)", artistId: "billie-eilish", album: "13 Reasons Why (Season 2)", year: 2018, dur: 200 },
  { videoId: "HUyb9CETmVE", title: "bury a friend", artistId: "billie-eilish", album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?", year: 2019, dur: 193 },
  { videoId: "wXhTHyIgQ_U", title: "Circles", artistId: "post-malone", album: "Hollywood's Bleeding", year: 2019, dur: 215 },
  { videoId: "ApXoWvfEYVU", title: "Sunflower (with Swae Lee)", artistId: "post-malone", album: "Spider-Man: Into the Spider-Verse", year: 2018, dur: 158 },
  { videoId: "UceaB4D0jpo", title: "rockstar (feat. 21 Savage)", artistId: "post-malone", album: "beerbongs & bentleys", year: 2017, dur: 218 },
  { videoId: "dvgZkm1xWPE", title: "Viva La Vida", artistId: "coldplay", album: "Viva la Vida or Death and All His Friends", year: 2008, dur: 242 },
  { videoId: "VPRjCeoBvrI", title: "A Sky Full of Stars", artistId: "coldplay", album: "Ghost Stories", year: 2014, dur: 268 },
  { videoId: "YykjpeuMNEk", title: "Hymn for the Weekend", artistId: "coldplay", album: "A Head Full of Dreams", year: 2016, dur: 258 },
  { videoId: "nfWlot6h_JM", title: "Shake It Off", artistId: "taylor-swift", album: "1989", year: 2014, dur: 219 },
  { videoId: "e-ORhEE9VVg", title: "Blank Space", artistId: "taylor-swift", album: "1989", year: 2014, dur: 231 },
  { videoId: "b1kbLwvqugk", title: "Anti-Hero", artistId: "taylor-swift", album: "Midnights", year: 2022, dur: 201 },
  { videoId: "5NV6Rdv1a3I", title: "Get Lucky (feat. Pharrell Williams)", artistId: "daft-punk", album: "Random Access Memories", year: 2013, dur: 248 },
  { videoId: "a5uQMwRMHcs", title: "Instant Crush (feat. Julian Casablancas)", artistId: "daft-punk", album: "Random Access Memories", year: 2013, dur: 337 },
  { videoId: "bpOSxM0rNPM", title: "Do I Wanna Know?", artistId: "arctic-monkeys", album: "AM", year: 2013, dur: 272 },
  { videoId: "VQH8ZTgna3Q", title: "R U Mine?", artistId: "arctic-monkeys", album: "AM", year: 2013, dur: 201 },
  { videoId: "IcrbM1l_BoI", title: "Wake Me Up", artistId: "avicii", album: "True", year: 2013, dur: 247 },
  { videoId: "UtF6Jej8yb4", title: "The Nights", artistId: "avicii", album: "The Days / Nights EP", year: 2014, dur: 176 },
  { videoId: "_ovdm2yX4MA", title: "Levels", artistId: "avicii", album: "Levels", year: 2011, dur: 212 },
  { videoId: "OPf0YbXqDm0", title: "Uptown Funk (feat. Bruno Mars)", artistId: "bruno-mars", album: "Uptown Special", year: 2014, dur: 270 },
  { videoId: "UqyT8IEBkvY", title: "24K Magic", artistId: "bruno-mars", album: "24K Magic", year: 2016, dur: 226 },
  { videoId: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", artistId: "queen", album: "A Night at the Opera", year: 1975, dur: 354 },
  { videoId: "HgzGwKwLmgM", title: "Don't Stop Me Now", artistId: "queen", album: "Jazz", year: 1978, dur: 209 },
];

function artistName(id: string): string {
  return ARTISTS.find((a) => a.id === id)?.name ?? id;
}

export function toTrack(t: TrackDef): Track {
  return {
    id: `yt:${t.videoId}`,
    videoId: t.videoId,
    title: t.title,
    artist: artistName(t.artistId),
    artistId: t.artistId,
    album: t.album,
    albumId: t.album ? `alb:${slugify(t.album)}:${t.artistId}` : undefined,
    year: t.year,
    durationSec: t.dur,
    artwork: ytThumb(t.videoId, "hq"),
    artworkSmall: ytThumb(t.videoId, "mq"),
    source: "demo",
  };
}

export const DEMO_TRACKS: Track[] = TRACKS.map(toTrack);

function albumIdFor(title: string, artistId: string): string {
  return `alb:${slugify(title)}:${artistId}`;
}

export function demoAlbums(): Album[] {
  const map = new Map<string, Album & { tracks: Track[] }>();
  for (const t of DEMO_TRACKS) {
    if (!t.album || !t.albumId) continue;
    let a = map.get(t.albumId);
    if (!a) {
      a = {
        id: t.albumId,
        title: t.album,
        artist: t.artist,
        artistId: t.artistId,
        year: t.year,
        artwork: t.artwork,
        source: "demo",
        tracks: [],
      };
      map.set(t.albumId, a);
    }
    a.tracks.push(t);
    if (t.year && t.year > (a.year ?? 0)) a.year = t.year;
  }
  return [...map.values()].map(({ tracks, ...a }) => ({ ...a, trackCount: tracks.length }));
}

export function demoAlbumDetail(id: string): AlbumDetail | null {
  const album = demoAlbums().find((a) => a.id === id);
  if (!album) return null;
  const tracks = DEMO_TRACKS.filter((t) => t.albumId === id);
  const artistDef = ARTISTS.find((a) => a.id === album.artistId);
  return { ...album, tracks, description: artistDef?.bio };
}

export function demoArtists(): Artist[] {
  return ARTISTS.map((a) => ({ id: a.id, name: a.name, bio: a.bio, source: "demo" as const }));
}

export function demoArtistDetail(id: string): ArtistDetail | null {
  const def = ARTISTS.find((a) => a.id === id);
  if (!def) return null;
  const tracks = DEMO_TRACKS.filter((t) => t.artistId === id);
  const albumsMap = new Map<string, Album>();
  const singles: Track[] = [];
  for (const t of tracks) {
    if (t.albumId && t.album) {
      const existing = albumsMap.get(t.albumId);
      if (!existing) {
        albumsMap.set(t.albumId, {
          id: t.albumId,
          title: t.album,
          artist: def.name,
          artistId: id,
          year: t.year,
          artwork: t.artwork,
          trackCount: tracks.filter((x) => x.albumId === t.albumId).length,
          source: "demo",
        });
      }
    } else {
      singles.push(t);
    }
  }
  const related = ARTISTS.filter((a) => a.id !== id)
    .sort((a, b) => hueFromString(a.id + id) - hueFromString(b.id + id))
    .slice(0, 6)
    .map((a) => ({ id: a.id, name: a.name, source: "demo" as const }));
  return {
    id,
    name: def.name,
    bio: def.bio,
    source: "demo",
    topTracks: tracks.slice(0, 8),
    albums: [...albumsMap.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    singles,
    related,
  };
}

const CURATED: { id: string; name: string; description: string; accent: number; videoIds: string[] }[] = [
  {
    id: "c_peak_energy",
    name: "Peak Energy",
    description: "Maximum-velocity pop and funk for the loudest part of your day.",
    accent: 14,
    videoIds: ["OPf0YbXqDm0", "TUVcZfQe-Kw", "4NRXx6U8ABQ", "nfWlot6h_JM", "oygrmJ5YZyI", "UqyT8IEBkvY", "9HDEHj2yzew", "JGwWNGJdvx8"],
  },
  {
    id: "c_late_night_drive",
    name: "Late Night Drive",
    description: "Synths, low lights and slow-motion city views.",
    accent: 262,
    videoIds: ["34Na4j8AVgA", "4NRXx6U8ABQ", "V1Pl5CzCzCw", "wXhTHyIgQ_U", "bpOSxM0rNPM", "a5uQMwRMHcs", "ApXoWvfEYVU"],
  },
  {
    id: "c_focus_flow",
    name: "Focus Flow",
    description: "Steady grooves and open skies — music for getting things done.",
    accent: 160,
    videoIds: ["5NV6Rdv1a3I", "a5uQMwRMHcs", "_ovdm2yX4MA", "VPRjCeoBvrI", "dvgZkm1xWPE", "UtF6Jej8yb4"],
  },
  {
    id: "c_throwback_gold",
    name: "Throwback Gold",
    description: "Timeless anthems from every decade that still hit.",
    accent: 40,
    videoIds: ["fJ9rUzIMcZQ", "HgzGwKwLmgM", "dvgZkm1xWPE", "_ovdm2yX4MA", "IcrbM1l_BoI", "5NV6Rdv1a3I"],
  },
];

function byVideoId(videoId: string): Track | undefined {
  return DEMO_TRACKS.find((t) => t.videoId === videoId);
}

export function demoCuratedPlaylists(): Playlist[] {
  return CURATED.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    accent: c.accent,
    owner: "curated" as const,
    trackCount: c.videoIds.length,
    cover: byVideoId(c.videoIds[0])?.artwork,
    tracks: c.videoIds.map(byVideoId).filter((t): t is Track => Boolean(t)),
  }));
}

export function demoCuratedMeta(): PlaylistMeta[] {
  return demoCuratedPlaylists().map(({ tracks, ...m }) => ({ ...m, trackCount: tracks.length }));
}

export function demoPlaylistDetail(id: string): Playlist | null {
  return demoCuratedPlaylists().find((p) => p.id === id) ?? null;
}

function score(q: string, ...fields: Array<string | undefined>): number {
  const needle = q.toLowerCase().trim();
  let best = 0;
  for (const f of fields) {
    if (!f) continue;
    const hay = f.toLowerCase();
    if (hay === needle) best = Math.max(best, 100);
    else if (hay.startsWith(needle)) best = Math.max(best, 80);
    else if (hay.includes(needle)) best = Math.max(best, 60);
  }
  return best;
}

export function demoSearch(q: string): SearchResults {
  const tracks = DEMO_TRACKS.map((t) => ({ t, s: score(q, t.title, t.artist, t.album) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 12)
    .map((x) => x.t);

  const artists = demoArtists()
    .map((a) => ({ a, s: score(q, a.name) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.a);

  const albums = demoAlbums()
    .map((a) => ({ a, s: score(q, a.title, a.artist) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.a);

  const playlists = demoCuratedMeta()
    .map((p) => ({ p, s: score(q, p.name, p.description) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

  return { query: q, tracks, artists, albums, playlists, mode: "demo" };
}

export function demoHome(): HomeData {
  const curated = demoCuratedPlaylists();
  const heroPl = curated[0];
  const albums = demoAlbums().sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 10);
  const trending = [...DEMO_TRACKS]
    .sort((a, b) => hueFromString("trend" + a.videoId) - hueFromString("trend" + b.videoId))
    .slice(0, 10);
  const forYou = [...DEMO_TRACKS]
    .sort((a, b) => hueFromString("foryou" + b.videoId) - hueFromString("foryou" + a.videoId))
    .slice(0, 10);
  return {
    hero: {
      eyebrow: "Featured today",
      title: heroPl.name,
      subtitle: "Curated by Mpfy",
      description: heroPl.description ?? "",
      artwork: heroPl.cover,
      accent: heroPl.accent ?? 14,
      tracks: heroPl.tracks,
      link: `/playlist/${heroPl.id}`,
    },
    trending,
    newReleases: albums,
    topArtists: demoArtists().slice(0, 10),
    curatedPlaylists: demoCuratedMeta(),
    forYou,
    mode: "demo",
  };
}

export const DEMO_ARTIST_BY_ID: Record<string, ArtistDef> = Object.fromEntries(
  ARTISTS.map((a) => [a.id, a])
);
export { albumIdFor };
