import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayTracksButton } from "@/components/actions";
import { AlbumCard, ArtistCard, MusicGrid, TrackList } from "@/components/cards";
import { ArtistAvatar } from "@/components/media";
import { SectionHeader } from "@/components/ui";
import { getArtistDetail } from "@/services/music";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtistDetail(decodeURIComponent(id)).catch(() => null);
  if (!artist) return { title: "Artist not found" };
  return {
    title: `${artist.name} — Artist`,
    description: artist.bio ?? `Listen to ${artist.name} on Mpfy.`,
    alternates: { canonical: `/artist/${id}` },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtistDetail(decodeURIComponent(id)).catch(() => null);
  if (!artist) notFound();

  return (
    <div className="fade-up mx-auto max-w-6xl px-4 pt-6 md:px-6">
      <div className="card relative overflow-hidden p-6 md:p-8" style={{ background: "linear-gradient(120deg, var(--s2), var(--s1) 70%)" }}>
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <ArtistAvatar name={artist.name} src={artist.artwork} className="aspect-square w-40 md:w-48" />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Artist</p>
            <h1 className="font-display mt-1 text-4xl font-extrabold tracking-tight md:text-5xl">{artist.name}</h1>
            {artist.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">{artist.bio}</p>}
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              {artist.topTracks.length > 0 && (
                <>
                  <PlayTracksButton tracks={artist.topTracks} label="Play" />
                  <PlayTracksButton tracks={artist.topTracks} label="Shuffle" shuffle variant="ghost" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {artist.topTracks.length > 0 && (
        <section aria-label="Popular songs" className="mt-10">
          <SectionHeader title="Popular" />
          <div className="card p-2">
            <TrackList tracks={artist.topTracks} />
          </div>
        </section>
      )}

      {artist.albums.length > 0 && (
        <section aria-label="Albums" className="mt-10">
          <SectionHeader title="Albums & releases" />
          <MusicGrid>
            {artist.albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </MusicGrid>
        </section>
      )}

      {artist.singles.length > 0 && (
        <section aria-label="Singles" className="mt-10">
          <SectionHeader title="Singles" />
          <div className="card p-2">
            <TrackList tracks={artist.singles} />
          </div>
        </section>
      )}

      {artist.related.length > 0 && (
        <section aria-label="Related artists" className="mt-10">
          <SectionHeader title="Fans also like" />
          <MusicGrid className="[grid-template-columns:repeat(auto-fill,minmax(130px,1fr))]">
            {artist.related.map((r) => (
              <ArtistCard key={r.id} artist={r} />
            ))}
          </MusicGrid>
        </section>
      )}

      <p className="mt-10 text-[11px] text-[var(--text-faint)]">
        Artist data {artist.source === "demo" ? "from Mpfy's demo catalog" : "from the YouTube Data API"}.
        Statistics are only shown when provided by the source. <Link href="/legal/third-party" className="underline-offset-2 hover:underline">Third-party services</Link>
      </p>
    </div>
  );
}
