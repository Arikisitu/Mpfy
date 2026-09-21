"use client";
import { create } from "zustand";
import type { Track } from "@/types/music";

interface DialogsState {
  addToTrack: Track | null;
  saveQueueOpen: boolean;
  share: { title: string; subtitle?: string; url: string; youtubeUrl?: string } | null;
  openAddTo: (t: Track) => void;
  openSaveQueue: () => void;
  openShare: (share: DialogsState["share"]) => void;
  closeAll: () => void;
}

export const useDialogs = create<DialogsState>((set) => ({
  addToTrack: null,
  saveQueueOpen: false,
  share: null,
  openAddTo: (addToTrack) => set({ addToTrack }),
  openSaveQueue: () => set({ saveQueueOpen: true }),
  openShare: (share) => set({ share }),
  closeAll: () => set({ addToTrack: null, saveQueueOpen: false, share: null }),
}));
