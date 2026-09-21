"use client";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  ListMusic,
  ListPlus,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMemo } from "react";
import { cn, formatDuration, hueFromString } from "@/lib/utils";
import { useDialogs } from "@/state/dialogs";
import { useIsLiked, useLibrary } from "@/state/library";
import { useCurrentTrack, usePlayer } from "@/state/player";
import { Artwork } from "./media";
import { TrackRow } from "./cards";
import { useHydrated } from "./ui";

function SeekBar({ compact = false }: { compact?: boolean }) {
  const elapsed = usePlayer((s) => s.elapsed);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seek);
  const pct = duration > 0 ? (elapsed / duration) * 100 : 0;
  return (
    <div className={cn("flex w-full items-center gap-2", compact && "gap-1.5")}>
      {!compact && (
        <span className="w-10 text-right text-[11px] tabular-nums text-[var(--text-faint)]">
          {formatDuration(elapsed)}
        </span>
      )}
      <input
        type="range"
        className="mpfy-range flex-1"
        min={0}
        max={Math.max(duration, 1)}
        step={1}
        value={Math.min(elapsed, Math.max(duration, 1))}
        style={{ ["--fill" as string]: `${pct}%` }}
        aria-label="Seek"
        onChange={(e) => seek(Number(e.target.value))}
      />
      {!compact && (
        <span className="w-10 text-[11px] tabular-nums text-[var(--text-faint)]">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}

function Transport({ size = "md" }: { size?: "md" | "lg" }) {
  const playing = usePlayer((s) => s.playing);
  const buffering = usePlayer((s) => s.buffering);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { toggle, next, prev, toggleShuffle, cycleRepeat } = usePlayer.getState();
  const btn = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const icon = size === "lg" ? "h-6 w-6" : "h-[18px] w-[18px]";
  const playIcon = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className={cn("icon-btn", btn, shuffle && "text-[var(--accent)]")}
        aria-label={`Shuffle ${shuffle ? "on" : "off"}`}
        aria-pressed={shuffle}
        onClick={toggleShuffle}
      >
        <Shuffle className={icon} />
      </button>
      <button className={cn("icon-btn", btn)} aria-label="Previous track" onClick={prev}>
        <SkipBack className={cn(icon, "fill-current")} />
      </button>
      <button
        className={cn(
          "mx-1 flex items-center justify-center rounded-full bg-[var(--text)] text-[var(--bg)] transition-transform hover:scale-105 active:scale-95",
          size === "lg" ? "h-16 w-16" : "h-10 w-10"
        )}
        aria-label={playing ? "Pause" : "Play"}
        onClick={toggle}
      >
        {buffering ? (
          <Loader2 className={cn(playIcon, "animate-spin")} />
        ) : playing ? (
          <Pause className={cn(playIcon, "fill-current")} />
        ) : (
          <Play className={cn(playIcon, "ml-0.5 fill-current")} />
        )}
      </button>
      <button className={cn("icon-btn", btn)} aria-label="Next track" onClick={next}>
        <SkipForward className={cn(icon, "fill-current")} />
      </button>
      <button
        className={cn("icon-btn", btn, repeat !== "off" && "text-[var(--accent)]")}
        aria-label={`Repeat mode: ${repeat}`}
        onClick={cycleRepeat}
      >
        {repeat === "one" ? <Repeat1 className={icon} /> : <Repeat className={icon} />}
      </button>
    </div>
  );
}

function LikeButton({ className }: { className?: string }) {
  const track = useCurrentTrack();
  const liked = useIsLiked(track?.videoId);
  const toggleLike = useLibrary((s) => s.toggleLike);
  if (!track) return null;
  return (
    <button
      className={cn("icon-btn", className)}
      data-active={liked}
      aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
      onClick={() => toggleLike(track)}
    >
      <Heart className={cn("h-[18px] w-[18px]", liked && "fill-current")} />
    </button>
  );
}

function VolumeControl() {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const { setVolume, toggleMute } = usePlayer.getState();
  return (
    <div className="hidden w-36 items-center gap-2 xl:flex">
      <button className="icon-btn h-8 w-8" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
        {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input
        type="range"
        className="mpfy-range flex-1"
        min={0}
        max={100}
        value={muted ? 0 : Math.round(volume * 100)}
        style={{ ["--fill" as string]: `${muted ? 0 : volume * 100}%` }}
        aria-label="Volume"
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
      />
    </div>
  );
}

/* ---------------- queue panel ---------------- */

function QueuePanel() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const { setQueueOpen, removeAt, moveItem, clearQueue } = usePlayer.getState();
  const openSaveQueue = useDialogs((s) => s.openSaveQueue);

  return (
    <div
      className="sheet-up fixed inset-x-0 bottom-0 z-[60] flex max-h-[72vh] flex-col rounded-t-[24px] border border-[var(--line)] bg-[var(--s1)] shadow-[var(--shadow)] lg:inset-x-auto lg:bottom-[calc(var(--player-h)+12px)] lg:right-4 lg:max-h-[70vh] lg:w-[400px] lg:rounded-[var(--radius-lg)]"
      role="dialog"
      aria-label="Queue"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <div>
          <h2 className="font-display text-base font-bold">Up next</h2>
          <p className="text-xs text-[var(--text-dim)]">
            {queue.length} {queue.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn" title="Save queue as playlist" aria-label="Save queue as playlist" onClick={openSaveQueue}>
            <ListPlus className="h-4 w-4" />
          </button>
          <button
            className="icon-btn"
            title="Clear queue"
            aria-label="Clear queue"
            onClick={() => {
              clearQueue();
              setQueueOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="icon-btn" aria-label="Close queue" onClick={() => setQueueOpen(false)}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {queue.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-[var(--text-dim)]">
            Your queue is empty — play something or add songs from any track menu.
          </p>
        )}
        {queue.map((t, i) => (
          <TrackRow
            key={`${t.id}-${i}`}
            track={t}
            showArt
            reorderable
            onMove={(dir) => moveItem(i, i + dir)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      {queue.length > 0 && (
        <div className="border-t border-[var(--line)] p-3 text-center text-xs text-[var(--text-faint)]">
          Now playing #{index + 1} of {queue.length}
        </div>
      )}
    </div>
  );
}

/* ---------------- full screen player ---------------- */

function FullScreenPlayer() {
  const track = useCurrentTrack();
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const { setFullscreen, setQueueOpen, playAt } = usePlayer.getState();
  const openShare = useDialogs((s) => s.openShare);
  const hue = useMemo(() => hueFromString(track ? track.title + track.artist : "mpfy"), [track]);

  if (!track) return null;
  return (
    <div
      className="fade-in fixed inset-0 z-[65] flex flex-col"
      role="dialog"
      aria-label="Now playing"
      style={{
        background: `linear-gradient(180deg, hsl(${hue} 35% 16%), var(--bg) 70%)`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button className="icon-btn" aria-label="Minimize player" onClick={() => setFullscreen(false)}>
          <ChevronDown className="h-5 w-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)]">Now playing</p>
        <button className="icon-btn" aria-label="Open queue" onClick={() => setQueueOpen(true)}>
          <ListMusic className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-8 pb-8">
        <Artwork
          src={track.artwork}
          alt={track.title}
          className="aspect-square w-full max-w-[380px] rounded-[var(--radius-lg)] shadow-[var(--shadow)]"
          sizes="380px"
          priority
        />
        <div className="w-full text-center">
          <h1 className="font-display truncate text-2xl font-extrabold">{track.title}</h1>
          <p className="mt-1 truncate text-sm text-[var(--text-dim)]">
            {track.artist}
            {track.album ? ` — ${track.album}` : ""}
          </p>
        </div>
        <div className="w-full">
          <SeekBar />
        </div>
        <Transport size="lg" />
        <div className="flex w-full items-center justify-center gap-2">
          <LikeButton />
          <button
            className="icon-btn"
            aria-label="Share"
            onClick={() =>
              openShare({
                title: track.title,
                subtitle: track.artist,
                url: `${window.location.origin}/search?q=${encodeURIComponent(track.title + " " + track.artist)}`,
                youtubeUrl: `https://www.youtube.com/watch?v=${track.videoId}`,
              })
            }
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
        {index >= 0 && queue.length > 1 && (
          <button className="text-xs text-[var(--text-faint)] underline-offset-2 hover:underline" onClick={() => playAt((index + 1) % queue.length)}>
            Next: {queue[(index + 1) % queue.length]?.title}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- mini / bar players ---------------- */

function DesktopBar() {
  const track = useCurrentTrack();
  const queueOpen = usePlayer((s) => s.queueOpen);
  const { setQueueOpen, setFullscreen } = usePlayer.getState();
  if (!track) return null;
  return (
    <div className="glass hidden h-[var(--player-h)] items-center gap-4 border-t border-[var(--line)] px-4 lg:flex">
      <button
        className="flex min-w-0 items-center gap-3 text-left"
        style={{ width: "min(26%, 320px)" }}
        onClick={() => setFullscreen(true)}
        aria-label="Open full-screen player"
      >
        <Artwork src={track.artworkSmall ?? track.artwork} alt={track.title} className="h-13 w-13 shrink-0 rounded-lg" sizes="52px" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{track.title}</span>
          <span className="block truncate text-xs text-[var(--text-dim)]">{track.artist}</span>
        </span>
      </button>
      <LikeButton className="h-8 w-8" />
      <div className="flex flex-1 flex-col items-center gap-1">
        <Transport />
        <div className="w-full max-w-xl">
          <SeekBar compact />
        </div>
      </div>
      <VolumeControl />
      <button className="icon-btn" data-active={queueOpen} aria-label="Queue" onClick={() => setQueueOpen(!queueOpen)}>
        <ListMusic className="h-[18px] w-[18px]" />
      </button>
      <button className="icon-btn" aria-label="Expand player" onClick={() => setFullscreen(true)}>
        <ChevronUp className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function MobileMini() {
  const track = useCurrentTrack();
  const playing = usePlayer((s) => s.playing);
  const buffering = usePlayer((s) => s.buffering);
  const { toggle, next, setFullscreen } = usePlayer.getState();
  const elapsed = usePlayer((s) => s.elapsed);
  const duration = usePlayer((s) => s.duration);
  if (!track) return null;
  const pct = duration > 0 ? (elapsed / duration) * 100 : 0;
  return (
    <div className="glass fixed inset-x-2 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow)] lg:hidden">
      <div className="absolute left-0 top-0 h-0.5 bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
      <div
        className="flex w-full cursor-pointer items-center gap-3 p-2.5 text-left"
        onClick={() => setFullscreen(true)}
        role="button"
        tabIndex={0}
        aria-label="Open full-screen player"
        onKeyDown={(e) => {
          if (e.key === "Enter") setFullscreen(true);
        }}
      >
        <Artwork src={track.artworkSmall ?? track.artwork} alt={track.title} className="h-10 w-10 shrink-0 rounded-md" sizes="40px" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold">{track.title}</span>
          <span className="block truncate text-[11px] text-[var(--text-dim)]">{track.artist}</span>
        </span>
        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} role="group" aria-label="Playback controls">
          <button className="icon-btn h-9 w-9" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
            {buffering ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : playing ? (
              <Pause className="h-[18px] w-[18px] fill-current" />
            ) : (
              <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />
            )}
          </button>
          <button className="icon-btn h-9 w-9" aria-label="Next track" onClick={next}>
            <SkipForward className="h-[18px] w-[18px] fill-current" />
          </button>
        </span>
      </div>
    </div>
  );
}

export function PlayerRoot() {
  const queue = usePlayer((s) => s.queue);
  const fullscreen = usePlayer((s) => s.fullscreen);
  const queueOpen = usePlayer((s) => s.queueOpen);
  const hydrated = useHydrated();
  if (!hydrated || queue.length === 0) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 lg:left-[var(--sidebar-w)]">
        <DesktopBar />
      </div>
      <MobileMini />
      {queueOpen && <QueuePanel />}
      {fullscreen && <FullScreenPlayer />}
    </>
  );
}
