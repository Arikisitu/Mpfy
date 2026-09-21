/**
 * Thin wrapper around YouTube's official IFrame Player API.
 * Playback is 100% delegated to YouTube's embed — no stream URLs are
 * extracted, nothing is proxied or re-hosted.
 */

export type YTStateHandler = (state: number) => void;
export type YTErrorHandler = (code: number) => void;

export interface YTPlayerLike {
  loadVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(videoId: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  getVideoUrl(): string;
  destroy(): void;
}

export const YT_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

interface YTGlobal {
  Player?: new (
    el: HTMLElement | string,
    opts: {
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    }
  ) => YTPlayerLike;
}

declare global {
  interface Window {
    YT?: YTGlobal & { loaded?: number };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let player: YTPlayerLike | null = null;
let initPromise: Promise<YTPlayerLike> | null = null;
let stateHandler: YTStateHandler = () => {};
let errorHandler: YTErrorHandler = () => {};

export function setYTHandlers(onState: YTStateHandler, onError: YTErrorHandler) {
  stateHandler = onState;
  errorHandler = onError;
}

export function getEmbeddedPlayer(): YTPlayerLike | null {
  return player;
}

export function ensureYouTubePlayer(): Promise<YTPlayerLike> {
  if (player) return Promise.resolve(player);
  if (initPromise) return initPromise;

  initPromise = new Promise<YTPlayerLike>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("no window"));
      return;
    }
    let el = document.getElementById("mpfy-yt-player");
    if (!el) {
      let host = document.getElementById("mpfy-yt-host");
      if (!host) {
        host = document.createElement("div");
        host.id = "mpfy-yt-host";
        host.setAttribute("aria-hidden", "true");
        document.body.appendChild(host);
      }
      el = document.createElement("div");
      el.id = "mpfy-yt-player";
      host.appendChild(el);
    }

    const create = () => {
      const YT = window.YT;
      if (!YT?.Player || !el) {
        reject(new Error("YouTube player failed to initialize"));
        return;
      }
      try {
        player = new YT.Player(el, {
          width: "320",
          height: "180",
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            rel: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: () => player && resolve(player),
            onStateChange: (e) => stateHandler(e.data),
            onError: (e) => errorHandler(e.data),
          },
        });
      } catch {
        reject(new Error("YouTube player failed to initialize"));
      }
    };

    if (window.YT?.Player) {
      create();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      create();
    };
    if (!document.querySelector("script[data-mpfy-yt]")) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.setAttribute("data-mpfy-yt", "1");
      s.onerror = () => reject(new Error("Couldn't load YouTube playback. You may be offline."));
      document.head.appendChild(s);
    }
  }).catch((err) => {
    initPromise = null; // allow retry
    throw err;
  });

  return initPromise;
}
