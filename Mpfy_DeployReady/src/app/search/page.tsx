"use client";
import Link from "next/link";
import { ExternalLink, Play, Search as SearchIcon, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  AlbumCard,
  ArtistCard,
  MusicGrid,
  PlaylistCard,
  TrackRow,
} from "@/components/cards";
import { SectionHeader } from "@/components/ui";
import { EmptyState, ErrorState, Skeleton, SkeletonRow } from "@/components/media";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/state/library";
import { usePlayer } from "@/state/player";
import type { SearchResults } from "@/types/music";

const TABS = ["All", "Songs", "Artists", "Albums", "Playlists", "Videos"] as const;
type Tab = (typeof TABS)[number];

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [tab, setTab] = useState<Tab>("All");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const library = useLibrary();

  const runSearch = useCallback(async (query: string) => {
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const r = await api<SearchResults>(`/api/music/search?q=${encodeURIComponent(query)}`);
      if (mySeq !== seq.current) return; // stale response
      setResults(r);
      setActive(0);
    } catch (e) {
      if (mySeq !== seq.current) return;
      setError(e instanceof Error ? e.message : "Search failed");
      setResults(null);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, []);

  // debounce
  useEffect(() => {
    const query = q.trim();
    if (query.length === 0) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    const t = window.setTimeout(() => void runSearch(query), 350);
    return () => window.clearTimeout(t);
  }, [q, runSearch]);

  // sync from URL (e.g. top-bar search)
  useEffect(() => {
    const urlQ = params.get("q") ?? "";
    if (urlQ && urlQ !== q) setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const commit = (query: string) => {
    if (!query.trim()) return;
    library.addRecentSearch(query.trim());
  };

  // keyboard navigation over songs
  const songs = results?.tracks ?? [];
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(songs.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const query = q.trim();
      commit(query);
      if (songs.length > 0) {
        usePlayer.getState().playContext(songs, Math.min(active, songs.length - 1));
      } else if (query) {
        void runSearch(query);
      }
    } else if (e.key === "Escape") {
      setQ("");
    }
  };

  const hasAny =
    results &&
    (results.tracks.length > 0 ||
      results.artists.length > 0 ||
      results.albums.length > 0 ||
      results.playlists.length > 0);

  const topHit = useMemo(() => results?.tracks[0] ?? null, [results]);

  return (
    <div className="fade-up mx-auto max-w-6xl px-4 pt-6 md:px-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-faint)]" />
        <input
          ref={inputRef}
          autoFocus
          className="input !rounded-full !py-3.5 pl-12 pr-12 text-base"
          placeholder='Try "Blinding Lights", "Coldplay", "AM"…'
          aria-label="Search songs, artists, albums and playlists"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => q.trim() && commit(q)}
        />
        {q && (
          <button
            className="icon-btn absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* recent searches */}
      {!q && (
        <div className="mt-6">
          {library.recentSearches.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Recent searches</h2>
                <button
                  className="text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text)]"
                  onClick={library.clearRecentSearches}
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {library.recentSearches.map((r) => (
                  <span key={r} className="chip">
                    <button onClick={() => setQ(r)}>{r}</button>
                    <button
                      aria-label={`Remove ${r} from recent searches`}
                      onClick={() => library.removeRecentSearch(r)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon className="h-7 w-7" strokeWidth={1.5} />}
              title="Search everything"
              body="Find songs, artists, albums, playlists and videos. Use ↑ ↓ and Enter to play results without touching the mouse."
            />
          )}
        </div>
      )}

      {/* tabs */}
      {q && (
        <div className="scroll-x mt-5" role="tablist" aria-label="Search categories">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className="chip"
              data-active={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* results */}
      {q && (
        <div className="mt-6 space-y-10 pb-10">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="card p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          )}

          {!loading && error && <ErrorState title="Search unavailable" body={error} onRetry={() => void runSearch(q.trim())} />}

          {!loading && !error && results && !hasAny && (
            <EmptyState
              title={`No results for “${results.query}”`}
              body="Check the spelling or try fewer keywords — artist names and song titles work best."
            />
          )}

          {!loading && !error && results && topHit && (tab === "All" || tab === "Songs" || tab === "Videos") && (
            <section aria-label="Songs">
              <SectionHeader title={tab === "Videos" ? "Videos" : "Songs"} />
              {tab === "All" && (
                <div className="card mb-4 flex flex-wrap items-center gap-4 p-4">
                  <Link href={`/search?q=${encodeURIComponent(topHit.artist)}`} className="shrink-0">
                    <ArtworkThumb src={topHit.artwork} alt={topHit.title} big />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Top result</p>
                    <p className="font-display truncate text-xl font-extrabold">{topHit.title}</p>
                    <p className="truncate text-sm text-[var(--text-dim)]">
                      {topHit.artist}
                      {topHit.album ? ` · ${topHit.album}` : ""}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => usePlayer.getState().playContext(results.tracks, 0)}>
                    <Play className="h-4 w-4 fill-current" /> Play
                  </button>
                  <a
                    className="icon-btn"
                    aria-label="Open top result on YouTube"
                    href={`https://www.youtube.com/watch?v=${topHit.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
              {tab === "Videos" ? (
                <div className="card p-2">
                  {results.tracks.map((t, i) => (
                    <div key={t.id} className="row-hover flex items-center gap-3 px-2 py-2">
                      <ArtworkThumb src={t.artworkSmall ?? t.artwork} alt={t.title} />
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => usePlayer.getState().playContext(results.tracks, i)}
                      >
                        <p className="truncate text-sm font-bold">{t.title}</p>
                        <p className="truncate text-xs text-[var(--text-dim)]">{t.artist} · Video</p>
                      </button>
                      <a
                        className="icon-btn"
                        aria-label={`Open ${t.title} on YouTube`}
                        href={`https://www.youtube.com/watch?v=${t.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        className="btn btn-ghost !px-3 !py-1.5 text-xs"
                        onClick={() => usePlayer.getState().playContext(results.tracks, i)}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Play
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-2" role="listbox" aria-label="Song results">
                  {results.tracks.map((t, i) => (
                    <div
                      key={t.id}
                      onMouseEnter={() => setActive(i)}
                      className={cn(active === i && tab === "Songs" && "rounded-[var(--radius-md)] bg-[var(--s2)]")}
                    >
                      <TrackRow track={t} index={i} context={results.tracks} showAlbum />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {!loading && !error && results && (tab === "All" || tab === "Artists") && results.artists.length > 0 && (
            <section aria-label="Artists">
              <SectionHeader title="Artists" />
              <MusicGrid className="[grid-template-columns:repeat(auto-fill,minmax(130px,1fr))]">
                {results.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </MusicGrid>
            </section>
          )}

          {!loading && !error && results && (tab === "All" || tab === "Albums") && results.albums.length > 0 && (
            <section aria-label="Albums">
              <SectionHeader title="Albums" />
              <MusicGrid>
                {results.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </MusicGrid>
            </section>
          )}

          {!loading && !error && results && (tab === "All" || tab === "Playlists") && results.playlists.length > 0 && (
            <section aria-label="Playlists">
              <SectionHeader title="Playlists" />
              <MusicGrid>
                {results.playlists.map((p) => (
                  <PlaylistCard key={p.id} pl={p} />
                ))}
              </MusicGrid>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ArtworkThumb({ src, alt, big = false }: { src?: string; alt: string; big?: boolean }) {
  const size = big ? "h-24 w-24" : "h-12 w-12";
  return (
    <span
      className={cn("relative block shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--s2)]", size)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-12 w-full rounded-full" /></div>}>
      <SearchInner />
    </Suspense>
  );
}
