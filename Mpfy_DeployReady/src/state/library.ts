"use client";
/**
 * Library store — likes, history, playlists, recent searches, session user.
 * Guest data lives in localStorage; signed-in data syncs with the backend.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Playlist, Track, UserPublic } from "@/types/music";
import { api } from "@/lib/api";
import { toast } from "./toasts";

interface LibraryStore {
  user: UserPublic | null;
  loaded: boolean;
  liked: Track[];
  history: Track[];
  playlists: Playlist[];
  recentSearches: string[];

  init: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  toggleLike: (t: Track) => void;
  addHistory: (t: Track) => void;
  clearHistory: () => void;
  addRecentSearch: (q: string) => void;
  removeRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (pid: string, t: Track) => Promise<boolean>;
  removeFromPlaylist: (pid: string, index: number) => Promise<void>;
  reorderPlaylist: (pid: string, from: number, to: number) => Promise<void>;
  signOut: () => Promise<void>;
  clearLocalData: () => void;
}

const isLocalId = (id: string) => id.startsWith("g_");

function serverPlaylistTracks(pid: string): Promise<Track[]> {
  return api<{ playlist: { tracks: Track[] } }>(`/api/playlists/${encodeURIComponent(pid)}`).then(
    (r) => r.playlist.tracks
  );
}

export const useLibrary = create<LibraryStore>()(
  persist(
    (set, get) => ({
      user: null,
      loaded: false,
      liked: [],
      history: [],
      playlists: [],
      recentSearches: [],

      init: async () => {
        if (get().loaded) return;
        try {
          const me = await api<{ user: UserPublic | null }>("/api/auth/me");
          if (me.user) {
            set({ user: me.user });
            await get().refreshFromServer();
          } else {
            set({ user: null });
          }
        } catch {
          /* offline — keep local guest data */
        }
        set({ loaded: true });
      },

      refreshFromServer: async () => {
        try {
          const [likes, hist, pls] = await Promise.all([
            api<{ tracks: Track[] }>("/api/library/likes"),
            api<{ tracks: Track[] }>("/api/library/history"),
            api<{ playlists: Playlist[] }>("/api/playlists"),
          ]);
          set({
            liked: likes.tracks,
            history: hist.tracks,
            playlists: pls.playlists,
          });
        } catch {
          /* keep whatever we have */
        }
      },

      toggleLike: (t) => {
        const { liked, user } = get();
        const exists = liked.some((x) => x.videoId === t.videoId);
        const next = exists ? liked.filter((x) => x.videoId !== t.videoId) : [t, ...liked];
        set({ liked: next });
        if (user) {
          if (exists) {
            api("/api/library/likes", {
              method: "DELETE",
              body: JSON.stringify({ videoId: t.videoId }),
            }).catch(() => toast("Couldn't sync like", { kind: "error" }));
          } else {
            api("/api/library/likes", { method: "POST", body: JSON.stringify({ track: t }) }).catch(
              () => toast("Couldn't sync like", { kind: "error" })
            );
          }
        }
      },

      addHistory: (t) => {
        const { history, user } = get();
        const next = [t, ...history.filter((x) => x.videoId !== t.videoId)].slice(0, 100);
        set({ history: next });
        if (user) {
          api("/api/library/history", { method: "POST", body: JSON.stringify({ track: t }) }).catch(
            () => undefined
          );
        }
      },

      clearHistory: () => {
        set({ history: [] });
        if (get().user) {
          api("/api/library/history", { method: "DELETE" }).catch(() => undefined);
        }
        toast("History cleared");
      },

      addRecentSearch: (q) => {
        const clean = q.trim();
        if (!clean) return;
        set((s) => ({
          recentSearches: [clean, ...s.recentSearches.filter((x) => x !== clean)].slice(0, 8),
        }));
      },

      removeRecentSearch: (q) =>
        set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      createPlaylist: async (name, description) => {
        const { user, playlists } = get();
        const trimmed = name.trim();
        if (!trimmed) return null;
        if (user) {
          try {
            const r = await api<{ playlist: Playlist }>("/api/playlists", {
              method: "POST",
              body: JSON.stringify({ name: trimmed, description }),
            });
            set({ playlists: [...playlists, r.playlist] });
            return r.playlist;
          } catch {
            toast("Couldn't create playlist", { kind: "error" });
            return null;
          }
        }
        const pl: Playlist = {
          id: `g_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          description,
          owner: "user",
          tracks: [],
          accent: Math.floor(Math.random() * 360),
        };
        set({ playlists: [...playlists, pl] });
        return pl;
      },

      renamePlaylist: async (id, name) => {
        const { playlists, user } = get();
        set({ playlists: playlists.map((p) => (p.id === id ? { ...p, name } : p)) });
        if (user && !isLocalId(id)) {
          await api(`/api/playlists/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
          }).catch(() => toast("Couldn't rename playlist", { kind: "error" }));
        }
      },

      deletePlaylist: async (id) => {
        const { playlists, user } = get();
        set({ playlists: playlists.filter((p) => p.id !== id) });
        if (user && !isLocalId(id)) {
          await api(`/api/playlists/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() =>
            toast("Couldn't delete playlist", { kind: "error" })
          );
        }
        toast("Playlist deleted");
      },

      addToPlaylist: async (pid, t) => {
        const { playlists, user } = get();
        const pl = playlists.find((p) => p.id === pid);
        if (!pl) return false;
        if (pl.tracks.some((x) => x.videoId === t.videoId)) {
          toast("Already in that playlist");
          return false;
        }
        const tracks = [...pl.tracks, t];
        set({
          playlists: playlists.map((p) => (p.id === pid ? { ...p, tracks, trackCount: tracks.length } : p)),
        });
        if (user && !isLocalId(pid)) {
          await api(`/api/playlists/${encodeURIComponent(pid)}`, {
            method: "PATCH",
            body: JSON.stringify({ tracks }),
          }).catch(() => toast("Couldn't sync playlist", { kind: "error" }));
        }
        toast(`Added to “${pl.name}”`, { kind: "success" });
        return true;
      },

      removeFromPlaylist: async (pid, index) => {
        const { playlists, user } = get();
        const pl = playlists.find((p) => p.id === pid);
        if (!pl) return;
        const tracks = pl.tracks.filter((_, i) => i !== index);
        set({
          playlists: playlists.map((p) => (p.id === pid ? { ...p, tracks, trackCount: tracks.length } : p)),
        });
        if (user && !isLocalId(pid)) {
          await api(`/api/playlists/${encodeURIComponent(pid)}`, {
            method: "PATCH",
            body: JSON.stringify({ tracks }),
          }).catch(() => undefined);
        }
      },

      reorderPlaylist: async (pid, from, to) => {
        const { playlists, user } = get();
        const pl = playlists.find((p) => p.id === pid);
        if (!pl || from === to) return;
        const tracks = [...pl.tracks];
        const [item] = tracks.splice(from, 1);
        tracks.splice(to, 0, item);
        set({ playlists: playlists.map((p) => (p.id === pid ? { ...p, tracks } : p)) });
        if (user && !isLocalId(pid)) {
          await api(`/api/playlists/${encodeURIComponent(idOf(pid))}`, {
            method: "PATCH",
            body: JSON.stringify({ tracks }),
          }).catch(() => undefined);
        }
      },

      signOut: async () => {
        try {
          await api("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        set({ user: null, liked: [], history: [], playlists: [] });
        toast("Signed out");
      },

      clearLocalData: () => {
        set({ liked: [], history: [], playlists: [], recentSearches: [] });
        try {
          localStorage.removeItem("mpfy:library");
          localStorage.removeItem("mpfy:player");
        } catch {
          /* ignore */
        }
        toast("Local data cleared");
      },
    }),
    {
      name: "mpfy:library",
      version: 1,
      partialize: (s) => ({
        liked: s.user ? [] : s.liked,
        history: s.user ? [] : s.history,
        playlists: s.user ? [] : s.playlists,
        recentSearches: s.recentSearches,
      }),
    }
  )
);

function idOf(pid: string): string {
  return pid;
}

export function useIsLiked(videoId: string | undefined): boolean {
  return useLibrary((s) => (videoId ? s.liked.some((t) => t.videoId === videoId) : false));
}
