"use client";
import { Pause, Play, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/state/player";
import type { Track } from "@/types/music";

export function PlayTracksButton({
  tracks,
  label = "Play",
  shuffle = false,
  variant = "primary",
  className,
}: {
  tracks: Track[];
  label?: string;
  shuffle?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const playContext = usePlayer((s) => s.playContext);
  const playing = usePlayer((s) => s.playing);
  const toggle = usePlayer((s) => s.toggle);
  const queue = usePlayer((s) => s.queue);
  const sameContext =
    tracks.length > 0 && queue.length === tracks.length && queue[0]?.id === tracks[0]?.id;

  if (sameContext) {
    return (
      <button className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)} onClick={toggle}>
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        {playing ? "Pause" : label}
      </button>
    );
  }
  return (
    <button
      className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)}
      onClick={() => playContext(tracks, 0, { shuffle })}
    >
      {shuffle ? <Shuffle className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
      {label}
    </button>
  );
}
