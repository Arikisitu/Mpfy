"use client";
import { create } from "zustand";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  kind: "info" | "success" | "error";
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    window.setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(title: string, opts?: { body?: string; kind?: Toast["kind"] }) {
  useToasts.getState().push({ title, body: opts?.body, kind: opts?.kind ?? "info" });
}
