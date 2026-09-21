"use client";
import Link from "next/link";
import { Pencil, Play, Plus, Share2, Shuffle, Trash2 } from "lucide-react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PlayTracksButton } from "@/components/actions";
import { TrackRow } from "@/components/cards";
import { Artwork, EmptyState, ErrorState, GeneratedCover, Skeleton } from "@/components/media";
import { formatCount, formatTotalDuration } from "@/lib/utils";
import { useDialogs } from "@/state/dialogs";
import { useLibrary } from "@/state/library";
import type { Playlist } from "@/types/music";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const library = useLibrary();
  const [remote, setRemote] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLocal = id.startsWith("g_");
  const isNumeric = /^\d+$/.test(id);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLocal) {
        setRemote(null);
      } else {
        const res = await api<{ playlist: Playlist }>(
          isNumeric ? `/api/playlists/${encodeURIComponent(id)}` : `/api/music/playlist?id=${encodeURIComponent(id)}`
        );
        setRemote(res.playlist);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("signin");
      else setError(e instanceof Error ? e.message : "Couldn't load this playlist.");
      setRemote(null);
    } finally {
      setLoading(false);
    }
  }, [id, isLocal, isNumeric]);

  useEffect(() => {
    void load();
  }, [load]);

  const localPl = useMemo(
    () => library.playlists.find((p) => p.id === id) ?? null,
    [library.playlists, id]
  );

  const pl: Playlist | null = isLocal ? localPl : remote;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6 md:px-6">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error === "signin") {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10">
        <EmptyState
          title="Sign in to open this playlist"
          body="This playlist belongs to your Mpfy account. Sign in to load it."
          action={<Link href="/auth" className="btn btn-primary">Sign in</Link>}
        />
      </div>
    );
  }

  if (error || !pl) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10">
        {isLocal ? (
          <EmptyState title="Playlist not found" body="This playlist may have been deleted on another screen." />
        ) : (
          <ErrorState title="Couldn't load this playlist" body={error ?? undefined} onRetry={() => void load()} />
        )}
      </div>
    );
  }

  const owned = pl.owner === "user";
  const totalSec = pl.tracks.reduce((a, t) => a + (t.durationSec ?? 0), 0);
  const cover = pl.cover ?? pl.tracks[0]?.artwork;

  return (
    <div className="fade-up mx-auto max-w-5xl px-4 pt-6 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        {cover ? (
          <Artwork src={cover} alt={pl.name} className="aspect-square w-full max-w-[240px] rounded-[var(--radius-lg)] shadow-[var(--shadow)]" sizes="240px" priority />
        ) : (
          <GeneratedCover seed={pl.name} className="aspect-square w-full max-w-[240px] rounded-[var(--radius-lg)]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
            {owned ? "Your playlist" : pl.owner === "curated" ? "Curated playlist" : "Playlist"}
          </p>
          <h1 className="font-display mt-1 break-words text-3xl font-extrabold tracking-tight md:text-4xl">{pl.name}</h1>
          {pl.description && <p className="mt-2 text-sm text-[var(--text-dim)]">{pl.description}</p>}
          <p className="mt-1.5 text-xs text-[var(--text-faint)]">
            {formatCount(pl.tracks.length)}
            {totalSec > 0 ? ` · ${formatTotalDuration(totalSec)}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <PlayTracksButton tracks={pl.tracks} label="Play" />
            <PlayTracksButton tracks={pl.tracks} label="Shuffle" shuffle variant="ghost" />
            <ShareButton pl={pl} />
            {owned && <ManageButtons pl={pl} />}
          </div>
        </div>
      </div>

      {pl.tracks.length === 0 ? (
        <EmptyState
          title="This playlist is empty"
          body="Search for songs and use “Add to playlist” to fill it up."
          action={<Link href="/search" className="btn btn-primary"><Plus className="h-4 w-4" /> Find songs</Link>}
        />
      ) : (
        <div className="card mt-8 p-2">
          {pl.tracks.map((t, i) => (
            <TrackRow
              key={`${t.id}-${i}`}
              track={t}
              index={i}
              context={pl.tracks}
              showAlbum
              reorderable={owned}
              onMove={(dir) => void library.reorderPlaylist(pl.id, i, i + dir)}
              onRemove={owned ? () => void library.removeFromPlaylist(pl.id, i) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShareButton({ pl }: { pl: Playlist }) {
  const openShare = useDialogs((s) => s.openShare);
  return (
    <button
      className="btn btn-ghost"
      onClick={() =>
        openShare({
          title: pl.name,
          subtitle: pl.description,
          url: `${window.location.origin}/playlist/${encodeURIComponent(pl.id)}`,
        })
      }
    >
      <Share2 className="h-4 w-4" /> Share
    </button>
  );
}

function ManageButtons({ pl }: { pl: Playlist }) {
  const library = useLibrary();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(pl.name);
  return (
    <>
      {renaming ? (
        <span className="flex items-center gap-2">
          <input
            autoFocus
            className="input !w-48 !py-2"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && name.trim()) {
                await library.renamePlaylist(pl.id, name.trim());
                setRenaming(false);
              }
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        </span>
      ) : (
        <button className="icon-btn" aria-label="Rename playlist" title="Rename" onClick={() => { setName(pl.name); setRenaming(true); }}>
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button
        className="icon-btn"
        aria-label="Delete playlist"
        title="Delete playlist"
        onClick={async () => {
          if (window.confirm(`Delete “${pl.name}”? This can't be undone.`)) {
            await library.deletePlaylist(pl.id);
            window.location.href = "/library?tab=playlists";
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <span className="hidden items-center gap-1 text-[11px] text-[var(--text-faint)] sm:flex">
        <Play className="h-3 w-3" /> Drag rows with ↑ ↓ to reorder
      </span>
    </>
  );
}
