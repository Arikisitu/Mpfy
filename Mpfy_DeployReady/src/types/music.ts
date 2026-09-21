/** Core typed models shared across the whole app. */

export type UIMode = "apple" | "ytm" | "spotify";
export type SurfaceMode = "dark" | "light" | "amoled" | "system";
export type RepeatMode = "off" | "all" | "one";
export type TrackSource = "demo" | "ytapi";

export interface Track {
  id: string; // stable id, e.g. "yt:VIDEO_ID"
  videoId: string; // YouTube video id used for embed playback
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  albumId?: string;
  year?: number;
  durationSec?: number;
  artwork?: string;
  artworkSmall?: string;
  source: TrackSource;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  artwork?: string;
  source: TrackSource;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year?: number;
  artwork?: string;
  trackCount?: number;
  source: TrackSource;
}

export interface PlaylistMeta {
  id: string; // server id ("42") or local guest id ("g_xxx"); curated: "c_xxx"
  name: string;
  description?: string;
  cover?: string; // optional cover url; otherwise generated from tracks
  accent?: number; // hue used for generated cover
  trackCount?: number;
  owner: "curated" | "user";
}

export interface Playlist extends PlaylistMeta {
  tracks: Track[];
}

export interface ArtistDetail extends Artist {
  topTracks: Track[];
  albums: Album[];
  singles: Track[];
  related: Artist[];
}

export interface AlbumDetail extends Album {
  tracks: Track[];
  description?: string;
}

export interface SearchResults {
  query: string;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: PlaylistMeta[];
  mode: TrackSource;
}

export interface HeroData {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  artwork?: string;
  accent: number;
  tracks: Track[]; // context to play
  link?: string;
}

export interface HomeData {
  hero: HeroData;
  trending: Track[];
  newReleases: Album[];
  topArtists: Artist[];
  curatedPlaylists: PlaylistMeta[];
  forYou: Track[];
  mode: TrackSource;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string;
}

/** Payload guests can import into their account on first login/signup. */
export interface GuestImport {
  likes?: Track[];
  history?: Track[];
  playlists?: { name: string; description?: string; tracks: Track[] }[];
}

export const PLAYBACK_NOTICE =
  "Playback runs through YouTube's official embed player. YouTube may apply its own policies, including ads, inside the embed.";

export const AD_FREE_NOTICE =
  "Mpfy itself contains no third-party advertising UI — no banners, popups or sponsored cards.";
