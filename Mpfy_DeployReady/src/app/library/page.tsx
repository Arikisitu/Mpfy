"use client";
import Link from "next/link";
import {
  Clock3,
  Disc3,
  Heart,
  ListMusic,
  Mic2,
  Music2,
  Plus,
  Trash2,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PlayTracksButton } from "@/components/actions";
import { AlbumCard, ArtistCard, MusicGrid, PlaylistCard, TrackList, TrackRow } from "@/components/cards";
import { EmptyState, Skeleton } from "@/components/media";
import { useHydrated } from "@/components/ui";
import { toast } from "@/state/toasts";
import { useLibrary } from "@/state/library";
import { usePlayer } from "@/state/player";
import type { Album, Artist, PlaylistMeta } from "@/types/music";

const TABS = [
  { id: "songs", label: "Songs", icon: Music2 },
  { id: "albums", label: "Albums", icon: Disc3 },
  { id: "artists", label: "Artists", icon: Mic2 },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "history", label: "History", icon: Clock3 },
  { id: "favorites", label: "Favorites", icon: Heart },
] as const;

function LibraryInner() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "songs";
  const library = useLibrary();
  const hydrated = useHydrated();
  const { liked, history, playlists } = library;

  const albums: Album[] = useMemo(() => {
    const map = new Map<string, Album>();
    for (const t of [...liked, ...history]) {
      if (!t.albumId || !t.album || map.has(t.albumId)) continue;
      map.set(t.albumId, {
        id: t.albumId,
        title: t.album,
        artist: t.artist,
        artistId: t.artistId,
        year: t.year,
        artwork: t.artwork,
        source: t.source,
      });
    }
    return [...map.values()];
  }, [liked, history]);

  const artists: Artist[] = useMemo(() => {
    const map = new Map<string, Artist>();
    for (const t of liked) {
      if (map.has(t.artistId)) continue;
      map.set(t.artistId, { id: t.artistId, name: t.artist, source: t.source });
    }
    return [...map.values()];
  }, [liked]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6 md:px-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="fade-up mx-auto max-w-6xl px-4 pt-6 md:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Your Library</h1>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            {library.user
              ? `Synced to ${library.user.email}`
              : "Saved on this device — sign in to sync across devices."}
          </p>
        </div>
        {!library.user && (
          <Link href="/auth" className="btn btn-ghost">
            Sign in to sync
          </Link>
        )}
      </div>

      <div className="scroll-x mb-6" role="tablist" aria-label="Library sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={`/library?tab=${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              className="chip"
              data-active={tab === t.id}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "songs" && (
        <section aria-label="Liked songs">
          {liked.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-7 w-7" strokeWidth={1.5} />}
              title="No liked songs yet"
              body="Tap the heart on any track to keep it here forever."
              action={<Link href="/search" className="btn btn-primary">Find something to love</Link>}
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <PlayTracksButton tracks={liked} label={`Play all (${liked.length})`} />
                <PlayTracksButton tracks={liked} label="Shuffle" shuffle variant="ghost" />
              </div>
              <div className="card p-2">
                <TrackList tracks={liked} showAlbum />
              </div>
            </>
          )}
        </section>
      )}

      {tab === "albums" && (
        <section aria-label="Albums">
          {albums.length === 0 ? (
            <EmptyState icon={<Disc3 className="h-7 w-7" strokeWidth={1.5} />} title="No albums yet" body="Albums appear here when you like songs from them." />
          ) : (
            <MusicGrid>
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </MusicGrid>
          )}
        </section>
      )}

      {tab === "artists" && (
        <section aria-label="Artists">
          {artists.length === 0 ? (
            <EmptyState icon={<Mic2 className="h-7 w-7" strokeWidth={1.5} />} title="No artists yet" body="Artists you like will show up here." />
          ) : (
            <MusicGrid className="[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
              {artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </MusicGrid>
          )}
        </section>
      )}

      {tab === "playlists" && <PlaylistsTab />}

      {tab === "history" && (
        <section aria-label="History">
          {history.length === 0 ? (
            <EmptyState icon={<Clock3 className="h-7 w-7" strokeWidth={1.5} />} title="Nothing played yet" body="Songs you play will appear here so you can find them again." />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <PlayTracksButton tracks={history} label="Play history" />
                <button className="btn btn-ghost" onClick={library.clearHistory}>
                  <Trash2 className="h-4 w-4" /> Clear history
                </button>
              </div>
              <div className="card p-2">
                {history.map((t, i) => (
                  <TrackRow key={`${t.id}-${i}`} track={t} index={i} context={history} showAlbum />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "favorites" && (
        <section aria-label="Favorites">
          {liked.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-7 w-7" strokeWidth={1.5} />}
              title="Your favorites live here"
              body="Like songs to build your personal favorites wall."
            />
          ) : (
            <>
              <div className="mb-4">
                <PlayTracksButton tracks={liked} label="Play favorites" />
              </div>
              <MusicGrid>
                {liked.map((t) => (
                  <button
                    key={t.id}
                    className="card card-hover overflow-hidden text-left"
                    onClick={() => usePlayer.getState().playContext(liked, liked.findIndex((x) => x.id === t.id))}
                    aria-label={`Play ${t.title}`}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {t.artwork ? (
                        <img src={t.artwork} alt={t.title} loading="lazy" className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="aspect-square w-full bg-[var(--s2)]" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold">{t.title}</p>
                      <p className="truncate text-xs text-[var(--text-dim)]">{t.artist}</p>
                    </div>
                  </button>
                ))}
              </MusicGrid>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function PlaylistsTab() {
  const library = useLibrary();
  const playlists = library.playlists;

  return (
    <section aria-label="Playlists">
      <div className="mb-4 flex items-center gap-3">
        <button
          className="btn btn-primary"
          onClick={async () => {
            const name = window.prompt("Name your playlist");
            if (name?.trim()) {
              const pl = await library.createPlaylist(name.trim());
              if (pl) toast(`Created “${pl.name}”`, { kind: "success" });
            }
          }}
        >
          <Plus className="h-4 w-4" /> New playlist
        </button>
        {!library.user && <span className="text-xs text-[var(--text-faint)]">Guest playlists stay on this device.</span>}
      </div>
      {playlists.length === 0 ? (
        <EmptyState
          icon={<ListMusic className="h-7 w-7" strokeWidth={1.5} />}
          title="No playlists yet"
          body="Create a playlist to collect songs for every mood, or save your queue as one."
        />
      ) : (
        <MusicGrid>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} pl={p} />
          ))}
        </MusicGrid>
      )}
      <div className="mt-10">
        <h3 className="font-display mb-3 text-lg font-bold">Made by Mpfy</h3>
        <CuratedSuggestions />
      </div>
    </section>
  );
}

function CuratedSuggestions() {
  const [items, setItems] = useState<PlaylistMeta[] | null>(null);
  useEffect(() => {
    api<{ playlists: PlaylistMeta[] }>("/api/music/curated")
      .then((r) => setItems(r.playlists))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <Skeleton className="h-40 w-full" />;
  if (items.length === 0) return null;
  return (
    <MusicGrid>
      {items.map((p) => (
        <PlaylistCard key={p.id} pl={p} />
      ))}
    </MusicGrid>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-40 w-full" /></div>}>
      <LibraryInner />
    </Suspense>
  );
}
