"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Disc3,
  Heart,
  Home,
  Library,
  ListMusic,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Play,
  Plus,
  Search,
  Settings,
  Smartphone,
  Sun,
  Check,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/state/library";
import { usePlayer, setTrackStartListener } from "@/state/player";
import { applyThemeToDocument, UI_MODES, useSettings } from "@/state/settings";
import { toast } from "@/state/toasts";
import type { PlaylistMeta, SurfaceMode } from "@/types/music";
import { DialogHost } from "./dialogs";
import { ToastViewport, useHydrated } from "./ui";
import { PlayerRoot } from "./player";

/* ---------------- brand ---------------- */

export function MpfyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="mpfy-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7847" />
          <stop offset="100%" stopColor="#ff3d5e" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#mpfy-g)" />
      <g fill="#fff">
        <rect x="13" y="16" width="7" height="32" rx="3.5" />
        <rect x="24" y="24" width="7" height="24" rx="3.5" />
        <rect x="35" y="20" width="7" height="28" rx="3.5" />
        <rect x="46" y="12" width="7" height="36" rx="3.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Mpfy home">
      <MpfyIcon className="h-8 w-8" />
      {!compact && (
        <span className="font-display text-[19px] font-extrabold tracking-tight">Mpfy</span>
      )}
    </Link>
  );
}

/* ---------------- appearance selector (top-right) ---------------- */

function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { uiMode, surface, setUIMode, setSurface } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const surfaces: { id: SurfaceMode; label: string; icon: React.ReactNode }[] = [
    { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { id: "amoled", label: "AMOLED", icon: <Smartphone className="h-4 w-4" /> },
    { id: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        className="icon-btn"
        aria-label="Appearance"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Appearance"
        onClick={() => setOpen((o) => !o)}
      >
        <Palette className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Appearance settings"
          className="scale-in absolute right-0 z-[80] mt-2 w-[300px] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--s1)] p-3 shadow-[var(--shadow)]"
        >
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-faint)]">
            Appearance
          </p>
          <div className="space-y-1">
            {UI_MODES.map((m) => (
              <button
                key={m.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                  uiMode === m.id ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--s2)]"
                )}
                onClick={() => setUIMode(m.id)}
                role="radio"
                aria-checked={uiMode === m.id}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{
                    background:
                      m.id === "apple"
                        ? "hsl(350 84% 63%)"
                        : m.id === "ytm"
                          ? "hsl(8 92% 60%)"
                          : "hsl(145 62% 48%)",
                  }}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{m.name}</span>
                  <span className="block truncate text-xs text-[var(--text-dim)]">{m.blurb}</span>
                </span>
                {uiMode === m.id && <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
          <p className="px-2 pb-1.5 pt-3 text-xs font-bold uppercase tracking-wide text-[var(--text-faint)]">
            Theme
          </p>
          <div className="grid grid-cols-4 gap-1">
            {surfaces.map((s) => (
              <button
                key={s.id}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-1 py-2 text-[11px] font-bold transition-colors",
                  surface === s.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-dim)] hover:bg-[var(--s2)]"
                )}
                onClick={() => setSurface(s.id)}
                aria-pressed={surface === s.id}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- user menu ---------------- */

function UserMenu() {
  const user = useLibrary((s) => s.user);
  const signOut = useLibrary((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) {
    return (
      <Link href="/auth" className="btn btn-ghost !px-4 !py-2 text-[13px] max-md:hidden">
        Sign in
      </Link>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-extrabold text-[var(--accent-contrast)]"
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {user.name[0]?.toUpperCase()}
      </button>
      {open && (
        <div className="scale-in absolute right-0 z-[80] mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--s1)] py-1.5 shadow-[var(--shadow)]">
          <div className="border-b border-[var(--line)] px-4 py-2.5">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-[var(--text-dim)]">{user.email}</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-[var(--s2)]"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-[var(--text-dim)]" /> Settings
          </Link>
          <button
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-400 hover:bg-[var(--s2)]"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- sidebar ---------------- */

function NewPlaylistButton() {
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="sidebar-item w-full"
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        const name = window.prompt("Name your playlist");
        if (name?.trim()) {
          const pl = await createPlaylist(name.trim());
          if (pl) toast(`Created “${pl.name}”`, { kind: "success" });
        }
        setBusy(false);
      }}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--s3)]">
        <Plus className="h-3.5 w-3.5" />
      </span>
      New playlist
    </button>
  );
}

function Sidebar({ curated }: { curated: PlaylistMeta[] }) {
  const pathname = usePathname();
  const playlists = useLibrary((s) => s.playlists);
  const likedRaw = useLibrary((s) => s.liked.length);
  const hydrated = useHydrated();
  const likedCount = hydrated ? likedRaw : 0;

  const nav = [
    { href: "/", label: "Home", icon: <Home className="h-[18px] w-[18px]" />, active: pathname === "/" },
    { href: "/search", label: "Search", icon: <Search className="h-[18px] w-[18px]" />, active: pathname.startsWith("/search") },
    { href: "/library", label: "Library", icon: <Library className="h-[18px] w-[18px]" />, active: pathname.startsWith("/library") },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col border-r border-[var(--line)] bg-[var(--bg)]/60 p-4 lg:flex">
      <div className="px-2 pb-5 pt-1">
        <Wordmark />
      </div>
      <nav aria-label="Main">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="sidebar-item" data-active={n.active}>
            {n.icon}
            {n.label}
          </Link>
        ))}
        <Link href="/library?tab=favorites" className="sidebar-item" data-active={false}>
          <Heart className="h-[18px] w-[18px]" />
          Liked songs
          {likedCount > 0 && (
            <span className="ml-auto rounded-full bg-[var(--s3)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-dim)]">
              {likedCount}
            </span>
          )}
        </Link>
      </nav>
      <div className="my-4 border-t border-[var(--line)]" />
      <NewPlaylistButton />
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
        {hydrated && playlists.map((p) => (
          <Link
            key={p.id}
            href={`/playlist/${encodeURIComponent(p.id)}`}
            className="sidebar-item"
            data-active={pathname === `/playlist/${p.id}`}
          >
            <ListMusic className="h-4 w-4 shrink-0" />
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
        {curated.map((p) => (
          <Link
            key={p.id}
            href={`/playlist/${encodeURIComponent(p.id)}`}
            className="sidebar-item"
            data-active={pathname === `/playlist/${p.id}`}
          >
            <Disc3 className="h-4 w-4 shrink-0" />
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
      </div>
      <div className="space-y-0.5 border-t border-[var(--line)] pt-3 text-[12px]">
        {[
          ["/settings", "Settings"],
          ["/legal/about", "About Mpfy"],
          ["/legal/terms", "Terms"],
          ["/legal/privacy", "Privacy"],
          ["/legal/copyright", "Copyright"],
          ["/legal/third-party", "Third-party"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="sidebar-item !py-1.5 text-[var(--text-faint)]">
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

/* ---------------- top bar ---------------- */

function TopBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-30 glass border-b border-[var(--line)]">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <div className="lg:hidden">
          <Wordmark compact />
        </div>
        <form
          className="relative hidden flex-1 items-center md:flex"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--text-faint)]" />
          <input
            className="input max-w-md !rounded-full !py-2.5 pl-10"
            placeholder="Search songs, artists, albums…"
            aria-label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              if (!q) router.push("/search");
            }}
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/* ---------------- bottom nav (mobile) ---------------- */

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/search", label: "Search", icon: Search, active: pathname.startsWith("/search") },
    { href: "/library", label: "Library", icon: Library, active: pathname.startsWith("/library") && !pathname.includes("playlist") },
    { href: "/library?tab=playlists", label: "Playlists", icon: ListMusic, active: (pathname.startsWith("/library") && pathname.includes("playlist")) || pathname.startsWith("/playlist") },
  ];
  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--line)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-bold",
              item.active ? "text-[var(--accent)]" : "text-[var(--text-dim)]"
            )}
            aria-current={item.active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------------- shell ---------------- */

export function Shell({ children, curated }: { children: React.ReactNode; curated: PlaylistMeta[] }) {
  const { uiMode, surface, reduceMotion } = useSettings();
  const libraryInit = useLibrary((s) => s.init);

  useEffect(() => {
    applyThemeToDocument(uiMode, surface);
    document.documentElement.dataset.motion = reduceMotion === "auto" ? "auto" : reduceMotion;
    if (surface === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const onChange = () => applyThemeToDocument(useSettings.getState().uiMode, "system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [uiMode, surface, reduceMotion]);

  useEffect(() => {
    void libraryInit();
    setTrackStartListener((t) => useLibrary.getState().addHistory(t));

    const onOffline = () => toast("You're offline", { body: "Some features may be unavailable.", kind: "error" });
    const onOnline = () => toast("Back online", { kind: "success" });
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [libraryInit]);

  // Space bar toggles playback when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.code !== "Space") return;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName) || el.isContentEditable) return;
      e.preventDefault();
      usePlayer.getState().toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-bg min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[var(--accent-contrast)]"
      >
        Skip to content
      </a>
      <Sidebar curated={curated} />
      <div className="lg:pl-[var(--sidebar-w)]">
        <TopBar />
        <main id="main" className="min-h-[70vh] pb-[calc(var(--player-h)+110px)] lg:pb-[calc(var(--player-h)+24px)]">
          {children}
        </main>
      </div>
      <BottomNav />
      <PlayerRoot />
      <DialogHost />
      <ToastViewport />
    </div>
  );
}
