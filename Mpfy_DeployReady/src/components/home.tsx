"use client";
import Link from "next/link";
import {
  Clock3,
  Disc3,
  Flame,
  Heart,
  ListMusic,
  Mic2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AD_FREE_NOTICE } from "@/types/music";
import type { HomeData } from "@/types/music";
import { formatCount } from "@/lib/utils";
import { useLibrary } from "@/state/library";
import { usePlayer } from "@/state/player";
import { PlayTracksButton } from "./actions";
import { AlbumCard, ArtistCard, MusicGrid, PlaylistCard, QuickTile, TrackList } from "./cards";
import { Artwork, ErrorState } from "./media";
import { SectionHeader, useHydrated } from "./ui";

export function HomeView({ home }: { home: HomeData | null }) {
  const history = useLibrary((s) => s.history);
  const liked = useLibrary((s) => s.liked);
  const playlists = useLibrary((s) => s.playlists);
  const playContext = usePlayer((s) => s.playContext);
  const hydrated = useHydrated();

  if (!home) {
    return (
      <ErrorState
        title="Couldn't load your music feed"
        body="Something went wrong while fetching today's picks. You're offline or the service is busy."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const { hero } = home;

  return (
    <div className="fade-up mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-8">
      {/* ---------------- hero ---------------- */}
      <section
        aria-label="Featured"
        className="card relative overflow-hidden p-6 md:p-10"
        style={{
          background: `linear-gradient(120deg, hsl(${hero.accent} 45% 18% / 0.75), var(--s1) 62%)`,
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" /> {hero.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-2 text-sm font-semibold text-[var(--text-dim)]">{hero.subtitle}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-dim)]">{hero.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PlayTracksButton tracks={hero.tracks} label="Play" />
              {hero.link ? (
                <Link href={hero.link} className="btn btn-ghost">
                  Open playlist
                </Link>
              ) : (
                <PlayTracksButton tracks={hero.tracks} label="Shuffle" shuffle variant="ghost" />
              )}
            </div>
            <p className="mt-5 text-[11px] text-[var(--text-faint)]">{AD_FREE_NOTICE}</p>
          </div>
          <button
            className="group relative mx-auto w-full max-w-[340px]"
            onClick={() => playContext(hero.tracks, 0)}
            aria-label={`Play featured: ${hero.title}`}
          >
            <Artwork
              src={hero.artwork}
              alt={hero.title}
              className="aspect-square w-full rounded-[var(--radius-lg)] shadow-[var(--shadow)] transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(min-width: 768px) 340px, 80vw"
              priority
            />
            <span className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--shadow-sm)] opacity-90">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {home.mode === "demo" && (
        <p className="mt-3 text-center text-[11px] text-[var(--text-faint)]">
          Showing Mpfy's built-in demo catalog — set <code>YOUTUBE_API_KEY</code> for live YouTube
          Music data. Playback always uses YouTube's official embed.
        </p>
      )}

      {/* ---------------- quick access ---------------- */}
      <section aria-label="Quick access" className="mt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickTile title="Recently played" subtitle={hydrated && history.length > 0 ? formatCount(history.length) : "Jump back in"} icon={<Clock3 />} href="/library?tab=history" />
          <QuickTile title="Liked songs" subtitle={hydrated && liked.length > 0 ? formatCount(liked.length) : "Your favorites"} icon={<Heart />} href="/library?tab=favorites" />
          <QuickTile title="Your playlists" subtitle={hydrated && playlists.length > 0 ? `${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}` : "Create one"} icon={<ListMusic />} href="/library?tab=playlists" />
          <QuickTile title="Trending" subtitle="What's hot right now" icon={<Flame />} href="#trending" accent={14} />
          <QuickTile title="New releases" subtitle="Fresh albums" icon={<Disc3 />} href="#new-releases" accent={200} />
          <QuickTile
            title="Mpfy Mix"
            subtitle="Instant recommended mix"
            icon={<Sparkles />}
            href="#for-you"
            accent={280}
          />
        </div>
      </section>

      {/* ---------------- trending ---------------- */}
      <section id="trending" aria-label="Trending" className="mt-10 scroll-mt-24">
        <SectionHeader title="Trending now" subtitle="The loudest tracks on Mpfy this week" />
        <div className="card p-2">
          <TrackList tracks={home.trending} showAlbum />
        </div>
      </section>

      {/* ---------------- new releases ---------------- */}
      <section id="new-releases" aria-label="New releases" className="mt-10 scroll-mt-24">
        <SectionHeader title="New & notable albums" subtitle="Fresh drops and recent favorites" />
        <MusicGrid>
          {home.newReleases.slice(0, 8).map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </MusicGrid>
      </section>

      {/* ---------------- artists ---------------- */}
      <section aria-label="Popular artists" className="mt-10">
        <SectionHeader title="Popular artists" />
        <MusicGrid className="[grid-template-columns:repeat(auto-fill,minmax(130px,1fr))]">
          {home.topArtists.slice(0, 8).map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </MusicGrid>
      </section>

      {/* ---------------- playlists ---------------- */}
      <section aria-label="Curated playlists" className="mt-10">
        <SectionHeader title="Playlists for every mood" subtitle="Curated by Mpfy" />
        <MusicGrid>
          {home.curatedPlaylists.map((p) => (
            <PlaylistCard key={p.id} pl={p} />
          ))}
        </MusicGrid>
      </section>

      {/* ---------------- for you ---------------- */}
      <section id="for-you" aria-label="Recommended" className="mt-10 scroll-mt-24">
        <SectionHeader
          title="Made for you"
          subtitle="A recommended mix to start your session"
          action={<PlayTracksButton tracks={home.forYou} label="Play mix" variant="ghost" />}
        />
        <div className="card p-2">
          <TrackList tracks={home.forYou} />
        </div>
      </section>

      {/* footer note */}
      <footer className="mt-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[var(--line)] pb-6 pt-6 text-[11px] text-[var(--text-faint)]">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> Discovery powered by public music metadata
        </span>
        <span className="flex items-center gap-1">
          <Mic2 className="h-3 w-3" /> Playback via YouTube's official embed
        </span>
        <Link href="/legal/about" className="underline-offset-2 hover:underline">
          About Mpfy
        </Link>
        <Link href="/legal/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
        <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
