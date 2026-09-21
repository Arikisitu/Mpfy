"use client";
import Link from "next/link";
import {
  ChevronRight,
  Monitor,
  Moon,
  Palette,
  Play,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MpfyIcon } from "@/components/layout";
import { UI_MODES, useSettings } from "@/state/settings";
import { useLibrary } from "@/state/library";
import { AD_FREE_NOTICE, PLAYBACK_NOTICE, type SurfaceMode } from "@/types/music";
import { cn } from "@/lib/utils";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-display mb-4 flex items-center gap-2 text-base font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="block text-xs text-[var(--text-dim)]">{hint}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--accent)]" : "bg-[var(--s3)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const settings = useSettings();
  const library = useLibrary();
  const [version] = useState("1.0.0");

  useEffect(() => {
    document.title = "Settings · Mpfy";
  }, []);

  const surfaces: { id: SurfaceMode; label: string; icon: React.ReactNode }[] = [
    { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { id: "amoled", label: "AMOLED", icon: <Smartphone className="h-4 w-4" /> },
    { id: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="fade-up mx-auto max-w-3xl space-y-5 px-4 pt-6 md:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Settings</h1>

      <Section icon={<Palette />} title="Appearance">
        <div className="grid gap-2 sm:grid-cols-3">
          {UI_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => settings.setUIMode(m.id)}
              aria-pressed={settings.uiMode === m.id}
              className={cn(
                "rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                settings.uiMode === m.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] hover:bg-[var(--s2)]"
              )}
            >
              <span
                className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{
                  background:
                    m.id === "apple" ? "hsl(350 84% 63%)" : m.id === "ytm" ? "hsl(8 92% 60%)" : "hsl(145 62% 48%)",
                }}
              >
                <Play className="h-4 w-4 fill-current" />
              </span>
              <span className="block text-sm font-bold">{m.name}</span>
              <span className="block text-[11px] leading-snug text-[var(--text-dim)]">{m.blurb}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {surfaces.map((s) => (
            <button
              key={s.id}
              onClick={() => settings.setSurface(s.id)}
              aria-pressed={settings.surface === s.id}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border py-3 text-xs font-bold",
                settings.surface === s.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--text-dim)] hover:bg-[var(--s2)]"
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold">Motion</p>
          <div className="flex gap-2">
            {(["auto", "on", "off"] as const).map((m) => (
              <button
                key={m}
                className="chip"
                data-active={settings.reduceMotion === m}
                onClick={() => settings.setReduceMotion(m)}
              >
                {m === "auto" ? "Follow system" : m === "on" ? "Animations on" : "Reduced motion"}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={<Play />} title="Playback">
        <Toggle
          checked={settings.autoplay}
          onChange={settings.setAutoplay}
          label="Autoplay"
          hint="Continue playing the next song automatically"
        />
        <div className="mt-1 space-y-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--text-dim)]">
          <p>Volume normalization & crossfade — managed by YouTube's embed where supported; not forced by Mpfy.</p>
          <p>{PLAYBACK_NOTICE}</p>
          <p>{AD_FREE_NOTICE}</p>
        </div>
      </Section>

      <Section icon={<User />} title="Account">
        {library.user ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold">{library.user.name}</p>
              <p className="text-xs text-[var(--text-dim)]">{library.user.email}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => void library.signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-dim)]">
              You're browsing as a guest. Likes, history and playlists are stored on this device.
              Sign in to sync them.
            </p>
            <Link href="/auth" className="btn btn-primary">
              Sign in or create account
            </Link>
          </div>
        )}
      </Section>

      <Section icon={<Shield />} title="Privacy & data">
        <Toggle
          checked={settings.analytics}
          onChange={settings.setAnalytics}
          label="Anonymous usage analytics"
          hint="Off by default. No third-party ad tracking, ever."
        />
        <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
          <button className="btn btn-ghost" onClick={library.clearHistory}>
            <Trash2 className="h-4 w-4" /> Clear history
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm("Clear all locally stored Mpfy data on this device? This removes guest likes, history and playlists.")) {
                library.clearLocalData();
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Clear local data
          </button>
        </div>
      </Section>

      <Section icon={<MpfyIcon className="h-8 w-8" />} title="About Mpfy">
        <div className="space-y-2 text-sm text-[var(--text-dim)]">
          <p className="font-display text-lg font-bold text-[var(--text)]">Mpfy — an AI-built music experience.</p>
          <p>Built with AI-assisted development, human direction, and open web technologies.</p>
          <p>Version {version} · Not affiliated with YouTube, Apple, Spotify, or any record label.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            ["/legal/about", "About"],
            ["/legal/terms", "Terms of Service"],
            ["/legal/privacy", "Privacy Policy"],
            ["/legal/copyright", "Copyright / DMCA"],
            ["/legal/third-party", "Third-party services"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="chip justify-between">
              {label} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
