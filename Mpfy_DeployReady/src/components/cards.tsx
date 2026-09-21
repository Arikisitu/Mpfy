"use client";
import Link from "next/link";
import {
  Album as AlbumIcon,
  ArrowDown,
  ArrowUp,
  Disc3,
  ExternalLink,
  Heart,
  ListMusic,
  ListPlus,
  Mic2,
  MoreHorizontal,
  Play,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatDuration } from "@/lib/utils";
import { useDialogs } from "@/state/dialogs";
import { useIsLiked, useLibrary } from "@/state/library";
import { usePlayer } from "@/state/player";
import { toast } from "@/state/toasts";
import type { Album, AlbumDetail, Artist, PlaylistMeta, Track } from "@/types/music";
import { Artwork, ArtistAvatar, GeneratedCover } from "./media";
import { Dropdown, type MenuItem } from "./ui";

/* ---------------- shared bits ---------------- */

export function MusicGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("grid gap-4", className)}
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(var(--grid-min), 1fr))" }}
    >
      {children}
    </div>
  );
}

export function HScroll({ children }: { children: React.ReactNode }) {
  return <div className="scroll-x -mx-1 px-1">{children}</div>;
}

function usePlayAlbum() {
  const playContext = usePlayer((s) => s.playContext);
  return async (albumId: string, shuffle = false) => {
    try {
      const res = await api<{ album: AlbumDetail | null }>(
        `/api/music/album?id=${encodeURIComponent(albumId)}`
      );
      if (!res.album || res.album.tracks.length === 0) {
        toast("No playable tracks found on this album");
        return;
      }
      playContext(res.album.tracks, 0, { shuffle });
    } catch {
      toast("Couldn't load this album", { kind: "error" });
    }
  };
}

/* ---------------- cards ---------------- */

export function AlbumCard({ album }: { album: Album }) {
  const playAlbum = usePlayAlbum();
  return (
    <div className="group relative">
      <Link
        href={`/album/${encodeURIComponent(album.id)}`}
        className="card-hover block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--s1)] focus-visible:outline-2"
        aria-label={`${album.title} by ${album.artist}`}
      >
        <Artwork
          src={album.artwork}
          alt={album.title}
          className="aspect-square w-full"
          sizes="(min-width: 768px) 180px, 44vw"
        />
        <div className="p-3">
          <p className="truncate text-sm font-bold">{album.title}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-dim)]">
            {album.year ? `${album.artist} · ${album.year}` : album.artist}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          void playAlbum(album.id);
        }}
        aria-label={`Play ${album.title}`}
        className="absolute bottom-14 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] opacity-0 shadow-[var(--shadow-sm)] transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:scale-105"
      >
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </button>
    </div>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artist/${encodeURIComponent(artist.id)}`}
      className="card-hover block rounded-[var(--radius-lg)] border border-transparent p-3 text-center"
      aria-label={artist.name}
    >
      <ArtistAvatar name={artist.name} src={artist.artwork} className="mx-auto aspect-square w-full" />
      <p className="mt-3 truncate text-sm font-bold">{artist.name}</p>
      <p className="mt-0.5 text-xs text-[var(--text-dim)]">Artist</p>
    </Link>
  );
}

export function PlaylistCard({ pl }: { pl: PlaylistMeta }) {
  return (
    <Link
      href={`/playlist/${encodeURIComponent(pl.id)}`}
      className="card-hover group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--s1)]"
      aria-label={pl.name}
    >
      {pl.cover ? (
        <Artwork src={pl.cover} alt={pl.name} className="aspect-square w-full" sizes="180px" />
      ) : (
        <GeneratedCover seed={pl.name} className="aspect-square w-full" />
      )}
      <div className="p-3">
        <p className="truncate text-sm font-bold">{pl.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-dim)]">
          {pl.description || (pl.trackCount != null ? `${pl.trackCount} songs` : "Playlist")}
        </p>
      </div>
    </Link>
  );
}

/* ---------------- track menu ---------------- */

export function useTrackMenuItems(track: Track, context?: Track[], index?: number): MenuItem[] {
  const player = usePlayer.getState;
  const dialogs = useDialogs.getState;
  const liked = useIsLiked(track.videoId);

  return [
    {
      label: "Play now",
      icon: <Play />,
      onClick: () => {
        if (context && context.length > 0) player().playContext(context, index ?? 0);
        else player().playContext([track]);
      },
    },
    { label: "Play next", icon: <ListPlus />, onClick: () => player().playNextInQueue(track) },
    { label: "Add to queue", icon: <ListMusic />, onClick: () => player().addToQueue(track) },
    { label: "Add to playlist…", icon: <ListPlus />, onClick: () => dialogs().openAddTo(track) },
    {
      label: liked ? "Remove from Liked" : "Like",
      icon: <Heart className={liked ? "fill-current" : undefined} />,
      active: liked,
      onClick: () => {
        useLibrary.getState().toggleLike(track);
        toast(liked ? "Removed from Liked Songs" : "Added to Liked Songs", { kind: "success" });
      },
    },
    ...(track.albumId
      ? [
          {
            label: "Go to album",
            icon: <Disc3 />,
            onClick: () => {
              window.location.href = `/album/${encodeURIComponent(track.albumId!)}`;
            },
          },
        ]
      : []),
    {
      label: "Go to artist",
      icon: <Mic2 />,
      onClick: () => {
        window.location.href = `/artist/${encodeURIComponent(track.artistId)}`;
      },
    },
    {
      label: "Share…",
      icon: <Share2 />,
      onClick: () =>
        dialogs().openShare({
          title: track.title,
          subtitle: track.artist,
          url: `${window.location.origin}/search?q=${encodeURIComponent(track.title + " " + track.artist)}`,
          youtubeUrl: `https://www.youtube.com/watch?v=${track.videoId}`,
        }),
    },
    {
      label: "Open on YouTube",
      icon: <ExternalLink />,
      onClick: () => window.open(`https://www.youtube.com/watch?v=${track.videoId}`, "_blank", "noopener"),
    },
  ];
}

/* ---------------- track row ---------------- */

export function TrackRow({
  track,
  index,
  context,
  showAlbum = false,
  showArt = true,
  reorderable = false,
  onRemove,
  onMove,
}: {
  track: Track;
  index?: number;
  context?: Track[];
  showAlbum?: boolean;
  showArt?: boolean;
  reorderable?: boolean;
  onRemove?: () => void;
  onMove?: (dir: -1 | 1) => void;
}) {
  const playContext = usePlayer((s) => s.playContext);
  const currentId = usePlayer((s) => (s.queue.length ? s.queue[s.index]?.id : undefined));
  const playing = usePlayer((s) => s.playing);
  const liked = useIsLiked(track.videoId);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const items = useTrackMenuItems(track, context, index);
  const isCurrent = currentId === track.id;

  return (
    <div
      className={cn("row-hover group flex items-center gap-3 px-2", isCurrent && "bg-[var(--s2)]")}
      style={{ paddingTop: "var(--row-pad-y)", paddingBottom: "var(--row-pad-y)" }}
    >
      {typeof index === "number" && (
        <div className="w-6 shrink-0 text-right text-sm tabular-nums text-[var(--text-faint)]">
          {isCurrent && playing ? (
            <span className="eq" aria-label="Playing">
              <span /> <span /> <span />
            </span>
          ) : (
            <span className="group-hover:hidden">{index + 1}</span>
          )}
          {!(isCurrent && playing) && (
            <button
              aria-label={`Play ${track.title}`}
              className="hidden text-[var(--text)] group-hover:block"
              onClick={() => playContext(context && context.length > 0 ? context : [track], context ? index : 0)}
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      )}
      {showArt && (
        <Artwork
          src={track.artworkSmall ?? track.artwork}
          alt={track.title}
          className="h-12 w-12 shrink-0 rounded-lg"
          sizes="48px"
        />
      )}
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => playContext(context && context.length > 0 ? context : [track], context ? (index ?? 0) : 0)}
      >
        <p className={cn("truncate text-sm font-bold", isCurrent && "text-[var(--accent)]")}>{track.title}</p>
        <p className="truncate text-xs text-[var(--text-dim)]">
          {track.artist}
          {showAlbum && track.album ? ` · ${track.album}` : ""}
        </p>
      </button>
      {reorderable && onMove && (
        <div className="hidden items-center gap-0.5 sm:flex">
          <button className="icon-btn h-7 w-7" aria-label="Move up" onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button className="icon-btn h-7 w-7" aria-label="Move down" onClick={() => onMove(1)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <button
        className="icon-btn h-8 w-8 max-md:hidden"
        aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
        data-active={liked}
        onClick={() => toggleLike(track)}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      </button>
      {onRemove && (
        <button className="icon-btn h-8 w-8" aria-label="Remove" onClick={onRemove}>
          <X className="h-4 w-4" />
        </button>
      )}
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--text-faint)]">
        {formatDuration(track.durationSec)}
      </span>
      <Dropdown trigger={<MoreHorizontal className="h-4 w-4" />} items={items} ariaLabel={`More options for ${track.title}`} />
    </div>
  );
}

export function TrackList({
  tracks,
  showAlbum = false,
  startIndexOffset = 0,
  numbered = true,
}: {
  tracks: Track[];
  showAlbum?: boolean;
  startIndexOffset?: number;
  numbered?: boolean;
}) {
  return (
    <div role="list" aria-label="Tracks">
      {tracks.map((t, i) => (
        <TrackRow
          key={`${t.id}-${i}`}
          track={t}
          index={numbered ? i + startIndexOffset : undefined}
          context={tracks}
          showAlbum={showAlbum}
        />
      ))}
    </div>
  );
}

/* ---------------- quick access tile ---------------- */

export function QuickTile({
  title,
  subtitle,
  icon,
  href,
  accent,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
  accent?: number;
}) {
  return (
    <Link
      href={href}
      className="card card-hover flex items-center gap-3 p-4"
      style={accent != null ? { background: `linear-gradient(135deg, hsl(${accent} 45% 22% / 0.5), var(--s1))` } : undefined}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent)] [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-[var(--text-dim)]">{subtitle}</p>
      </div>
    </Link>
  );
}

export { AlbumIcon, Trash2 };
