"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SurfaceMode, UIMode } from "@/types/music";

interface SettingsStore {
  uiMode: UIMode;
  surface: SurfaceMode;
  autoplay: boolean;
  analytics: boolean;
  reduceMotion: "auto" | "off" | "on";
  setUIMode: (m: UIMode) => void;
  setSurface: (s: SurfaceMode) => void;
  setAutoplay: (b: boolean) => void;
  setAnalytics: (b: boolean) => void;
  setReduceMotion: (v: "auto" | "off" | "on") => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      uiMode: "apple",
      surface: "dark",
      autoplay: true,
      analytics: false,
      reduceMotion: "auto",
      setUIMode: (uiMode) => set({ uiMode }),
      setSurface: (surface) => set({ surface }),
      setAutoplay: (autoplay) => set({ autoplay }),
      setAnalytics: (analytics) => set({ analytics }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    { name: "mpfy:settings", version: 1 }
  )
);

export const UI_MODES: { id: UIMode; name: string; blurb: string }[] = [
  { id: "apple", name: "Essence", blurb: "Apple-inspired · spacious, airy, artwork-forward" },
  { id: "ytm", name: "Pulse", blurb: "YouTube Music-inspired · dense discovery feeds" },
  { id: "spotify", name: "Library", blurb: "Spotify-inspired · playlists & compact rows" },
];

export function applyThemeToDocument(uiMode: UIMode, surface: SurfaceMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.ui = uiMode;
  const resolved =
    surface === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : surface;
  root.dataset.surface = resolved;
}
