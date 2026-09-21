import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayTracksButton } from "@/components/actions";
import { TrackList } from "@/components/cards";
import { Artwork } from "@/components/media";
import { formatCount, formatTotalDuration } from "@/lib/utils";
import { getAlbumDetail } from "@/services/music";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbumDetail(decodeURIComponent(id)).catch(() => null);
  if (!album) return { title: "Album not found" };
  return {
    title: `${album.title} — ${album.artist}`,
    description: `Listen to ${album.title} by ${album.artist} on Mpfy.`,
    alternates: { canonical: `/album/${id}` },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const album = await getAlbumDetail(decodeURIComponent(id)).catch(() => null);
  if (!album) notFound();

  const totalSec = album.tracks.reduce((acc, t) => acc + (t.durationSec ?? 0), 0);

  return (
    <div className="fade-up mx-auto max-w-5xl px-4 pt-6 md:px-6">
      <nav className="mb-4 text-xs text-[var(--text-faint)]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--text)]">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--text-dim)]">Album</span>
      </nav>
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <Artwork
          src={album.artwork}
          alt={album.title}
          className="aspect-square w-full max-w-[260px] rounded-[var(--radius-lg)] shadow-[var(--shadow)]"
          sizes="260px"
          priority
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Album</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">{album.title}</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            <Link href={`/artist/${encodeURIComponent(album.artistId)}`} className="font-bold text-[var(--text)] hover:underline">
              {album.artist}
            </Link>
            {album.year ? ` · ${album.year}` : ""} · {formatCount(album.tracks.length)}
            {totalSec > 0 ? ` · ${formatTotalDuration(totalSec)}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PlayTracksButton tracks={album.tracks} label="Play all" />
            <PlayTracksButton tracks={album.tracks} label="Shuffle" shuffle variant="ghost" />
          </div>
        </div>
      </div>
      <div className="card mt-8 p-2">
        <TrackList tracks={album.tracks} />
      </div>
      {album.description && (
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--text-dim)]">{album.description}</p>
      )}
      <p className="mt-8 text-[11px] text-[var(--text-faint)]">
        Playback is streamed through YouTube's official embed player. Track availability depends on
        the uploader's embedding settings.
      </p>
    </div>
  );
}
