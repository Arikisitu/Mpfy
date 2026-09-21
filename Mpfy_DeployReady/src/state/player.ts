"use client";
/**
 * Player store — queue, playback state, shuffle/repeat.
 * All actual audio playback is delegated to YouTube's official
 * IFrame embed (see src/lib/yt.ts). Race conditions are guarded by a
 * monotonically increasing operation token.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RepeatMode, Track } from "@/types/music";
import {
  ensureYouTubePlayer,
  getEmbeddedPlayer,
  setYTHandlers,
  YT_STATES,
  type YTPlayerLike,
} from "@/lib/yt";
import { toast } from "./toasts";

interface PlayerStore {
  queue: Track[];
  index: number;
  playing: boolean;
  buffering: boolean;
  started: boolean; // has the user started any playback this session
  elapsed: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  queueOpen: boolean;
  unshuffled: Track[]; // order before shuffling, for restoring

  playContext: (tracks: Track[], startAt?: number, opts?: { shuffle?: boolean }) => void;
  playTrack: (track: Track, context?: Track[]) => void;
  playAt: (i: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (t: Track | Track[]) => void;
  playNextInQueue: (t: Track) => void;
  removeAt: (i: number) => void;
  moveItem: (from: number, to: number) => void;
  clearQueue: () => void;
  setFullscreen: (b: boolean) => void;
  setQueueOpen: (b: boolean) => void;
}

let opToken = 0;
let consecutiveErrors = 0;
let ytWired = false;
let onTrackStart: ((t: Track) => void) | null = null;

export function setTrackStartListener(cb: (t: Track) => void) {
  onTrackStart = cb;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const usePlayer = create<PlayerStore>()(
  persist(
    (set, get) => {
      async function loadTrack(index: number, autoplay = true) {
        const { queue, volume, muted } = get();
        const track = queue[index];
        if (!track) return;
        const token = ++opToken;
        consecutiveErrors = 0;
        set({ index, started: true, buffering: true, elapsed: 0, duration: track.durationSec ?? 0 });
        try {
          const p: YTPlayerLike = await ensureYouTubePlayer();
          if (token !== opToken) return; // a newer operation superseded this one
          p.setVolume(muted ? 0 : Math.round(volume * 100));
          if (autoplay) p.loadVideoById(track.videoId);
          else p.cueVideoById(track.videoId);
          onTrackStart?.(track);
        } catch {
          if (token === opToken) {
            set({ buffering: false, playing: false });
            toast("Playback unavailable", {
              body: "Couldn't reach YouTube's embed player. Check your connection.",
              kind: "error",
            });
          }
        }
      }

      function advance(dir: 1 | -1, auto = false) {
        const { queue, index, repeat, shuffle } = get();
        if (queue.length === 0) return;
        if (dir === 1) {
          if (index >= queue.length - 1) {
            if (repeat === "all") return void loadTrack(0);
            if (auto) {
              set({ playing: false, buffering: false });
              toast("End of queue");
              return;
            }
            return void loadTrack(0, false);
          }
          void loadTrack(index + 1);
          return;
        }
        // previous: restart current if >3s in, unless at first with repeat all
        const p = getEmbeddedPlayer();
        if (p && p.getCurrentTime() > 3) {
          get().seek(0);
          return;
        }
        if (index === 0) {
          if (repeat === "all") void loadTrack(queue.length - 1);
          else get().seek(0);
          return;
        }
        void loadTrack(index - 1);
        void shuffle;
      }

      function handleState(state: number) {
        const s = state;
        if (s === YT_STATES.PLAYING) {
          consecutiveErrors = 0;
          const p = getEmbeddedPlayer();
          set({
            playing: true,
            buffering: false,
            duration: p?.getDuration() || get().duration,
          });
        } else if (s === YT_STATES.PAUSED) {
          set({ playing: false, buffering: false });
        } else if (s === YT_STATES.BUFFERING) {
          set({ buffering: true });
        } else if (s === YT_STATES.ENDED) {
          const { repeat } = get();
          if (repeat === "one") {
            const p = getEmbeddedPlayer();
            p?.seekTo(0, true);
            p?.playVideo();
            return;
          }
          advance(1, true);
        }
      }

      function handleError() {
        const { queue, index } = get();
        const failed = queue[index];
        consecutiveErrors += 1;
        if (consecutiveErrors >= Math.max(queue.length, 2)) {
          set({ playing: false, buffering: false });
          toast("Playback unavailable for these tracks", {
            body: "The uploader may have disabled embedding.",
            kind: "error",
          });
          consecutiveErrors = 0;
          return;
        }
        toast("Playback unavailable for this track", {
          body: failed ? `“${failed.title}” can't be embedded — skipping.` : undefined,
          kind: "error",
        });
        advance(1, true);
      }

      if (!ytWired && typeof window !== "undefined") {
        ytWired = true;
        setYTHandlers(handleState, handleError);
        window.setInterval(() => {
          const p = getEmbeddedPlayer();
          if (!p) return;
          const st = get();
          if (!st.started || st.queue.length === 0) return;
          try {
            const t = p.getCurrentTime();
            const d = p.getDuration();
            if (isFinite(t) && isFinite(d)) {
              usePlayer.setState({ elapsed: t, duration: d || st.duration });
            }
          } catch {
            /* player not ready */
          }
        }, 500);
      }

      return {
        queue: [],
        index: 0,
        playing: false,
        buffering: false,
        started: false,
        elapsed: 0,
        duration: 0,
        shuffle: false,
        repeat: "off" as RepeatMode,
        volume: 0.8,
        muted: false,
        fullscreen: false,
        queueOpen: false,
        unshuffled: [],

        playContext: (tracks, startAt = 0, opts) => {
          if (!tracks || tracks.length === 0) {
            toast("Nothing to play yet");
            return;
          }
          const wantShuffle = opts?.shuffle ?? false;
          let queue = [...tracks];
          let index = Math.min(startAt, queue.length - 1);
          let unshuffled: Track[] = [...tracks];
          if (wantShuffle) {
            const first = queue[index];
            queue = shuffleArray(queue);
            queue = [first, ...queue.filter((t) => t.id !== first.id)];
            index = 0;
            unshuffled = [...tracks];
          }
          set({ queue, index, shuffle: wantShuffle, unshuffled, fullscreen: false });
          void loadTrack(index);
        },

        playTrack: (track, context) => {
          if (context && context.length > 0) {
            const i = context.findIndex((t) => t.id === track.id);
            get().playContext(context, i >= 0 ? i : 0);
          } else {
            get().playContext([track], 0);
          }
        },

        playAt: (i) => void loadTrack(i),

        toggle: () => {
          const p = getEmbeddedPlayer();
          const { playing, started, queue, index } = get();
          if (!started) {
            if (queue.length > 0) void loadTrack(index);
            return;
          }
          if (!p) return;
          if (playing) p.pauseVideo();
          else p.playVideo();
        },

        next: () => advance(1),
        prev: () => advance(-1),

        seek: (sec) => {
          const p = getEmbeddedPlayer();
          if (!p) return;
          p.seekTo(sec, true);
          set({ elapsed: sec });
        },

        setVolume: (v) => {
          const p = getEmbeddedPlayer();
          p?.setVolume(Math.round(v * 100));
          if (v > 0 && get().muted) p?.unMute();
          set({ volume: v, muted: v === 0 });
        },

        toggleMute: () => {
          const p = getEmbeddedPlayer();
          const muted = !get().muted;
          if (muted) p?.setVolume(0);
          else p?.setVolume(Math.round(get().volume * 100));
          set({ muted });
        },

        toggleShuffle: () => {
          const { shuffle, queue, index, unshuffled } = get();
          const current = queue[index];
          if (!shuffle) {
            const rest = queue.filter((_, i) => i !== index);
            const shuffled = [current, ...shuffleArray(rest)].filter((t): t is Track => Boolean(t));
            set({ shuffle: true, unshuffled: queue, queue: shuffled, index: 0 });
          } else {
            const base = unshuffled.length > 0 ? unshuffled : queue;
            const idx = Math.max(0, base.findIndex((t) => t.id === current?.id));
            set({ shuffle: false, queue: base, index: idx, unshuffled: [] });
          }
        },

        cycleRepeat: () => {
          const order: RepeatMode[] = ["off", "all", "one"];
          const nextMode = order[(order.indexOf(get().repeat) + 1) % 3];
          set({ repeat: nextMode });
        },

        addToQueue: (t) => {
          const items = Array.isArray(t) ? t : [t];
          if (items.length === 0) return;
          const { queue, started } = get();
          set({ queue: [...queue, ...items] });
          if (!started) void loadTrack(0);
          else toast(`Added ${items.length === 1 ? "to queue" : `${items.length} songs to queue`}`);
        },

        playNextInQueue: (t) => {
          const { queue, index, started } = get();
          const copy = [...queue];
          copy.splice(index + 1, 0, t);
          set({ queue: copy });
          if (!started) void loadTrack(0);
          else toast("Playing next");
        },

        removeAt: (i) => {
          const { queue, index } = get();
          if (i < 0 || i >= queue.length) return;
          const copy = queue.filter((_, idx) => idx !== i);
          let newIndex = index;
          if (i < index) newIndex = index - 1;
          else if (i === index && copy.length > 0) {
            newIndex = Math.min(index, copy.length - 1);
            set({ queue: copy, index: newIndex });
            void loadTrack(newIndex);
            return;
          }
          set({ queue: copy, index: Math.max(0, newIndex) });
        },

        moveItem: (from, to) => {
          const { queue, index } = get();
          if (from === to || from < 0 || from >= queue.length || to < 0 || to >= queue.length)
            return;
          const copy = [...queue];
          const [item] = copy.splice(from, 1);
          copy.splice(to, 0, item);
          let newIndex = index;
          if (from === index) newIndex = to;
          else if (from < index && to >= index) newIndex = index - 1;
          else if (from > index && to <= index) newIndex = index + 1;
          set({ queue: copy, index: newIndex });
        },

        clearQueue: () => {
          opToken++;
          const p = getEmbeddedPlayer();
          p?.pauseVideo();
          set({
            queue: [],
            index: 0,
            playing: false,
            buffering: false,
            started: false,
            elapsed: 0,
            duration: 0,
            unshuffled: [],
          });
          toast("Queue cleared");
        },

        setFullscreen: (fullscreen) => set({ fullscreen }),
        setQueueOpen: (queueOpen) => set({ queueOpen }),
      };
    },
    {
      name: "mpfy:player",
      version: 1,
      partialize: (s) => ({
        queue: s.queue.slice(0, 200),
        index: s.index,
        shuffle: s.shuffle,
        repeat: s.repeat,
        volume: s.volume,
        unshuffled: s.unshuffled.slice(0, 200),
      }),
    }
  )
);

export function useCurrentTrack(): Track | null {
  return usePlayer((s) => (s.queue.length > 0 ? s.queue[s.index] ?? null : null));
}
