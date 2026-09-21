"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { MpfyIcon } from "@/components/layout";
import { isValidEmail } from "@/lib/utils";
import { useLibrary } from "@/state/library";
import { toast } from "@/state/toasts";
import type { GuestImport, Track, UserPublic } from "@/types/music";

type Mode = "signin" | "signup" | "reset-request" | "reset-confirm";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function guestImport(): GuestImport {
    const s = useLibrary.getState();
    if (s.user) return {};
    return {
      likes: s.liked as Track[],
      history: s.history.slice(0, 100) as Track[],
      playlists: s.playlists.map((p) => ({ name: p.name, description: p.description, tracks: p.tracks })),
    };
  }

  async function afterAuth(user: UserPublic) {
    useLibrary.setState({ user, liked: [], history: [], playlists: [] });
    await useLibrary.getState().refreshFromServer();
    toast(`Welcome, ${user.name.split(" ")[0]}`, { kind: "success" });
    router.push("/");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (mode !== "reset-request" && password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (mode === "signup" && name.trim().length < 2) return setError("Please enter your name.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const r = await api<{ user: UserPublic }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, import: guestImport() }),
        });
        await afterAuth(r.user);
      } else if (mode === "signup") {
        const r = await api<{ user: UserPublic }>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, name: name.trim(), password, import: guestImport() }),
        });
        await afterAuth(r.user);
      } else if (mode === "reset-request") {
        const r = await api<{ ok: boolean; demo?: boolean; demoCode?: string }>("/api/auth/reset-request", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        if (r.demo && r.demoCode) setDemoCode(r.demoCode);
        setMode("reset-confirm");
      } else {
        if (code.trim().length !== 6) return setError("Enter the 6-digit code.");
        await api("/api/auth/reset-confirm", {
          method: "POST",
          body: JSON.stringify({ email, code: code.trim(), password }),
        });
        toast("Password updated — sign in with your new password", { kind: "success" });
        setMode("signin");
        setPassword("");
        setCode("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";

  return (
    <div className="fade-up mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <MpfyIcon className="h-14 w-14" />
        <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          {mode === "signup"
            ? "Sync your likes, history and playlists across devices."
            : mode === "signin"
              ? "Sign in to sync your music everywhere."
              : "We'll help you get back into your music."}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3 p-5">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-[var(--text-dim)]">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-[var(--text-dim)]">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {mode === "reset-confirm" && (
          <div>
            <label htmlFor="code" className="mb-1.5 block text-xs font-bold text-[var(--text-dim)]">Reset code</label>
            <input id="code" className="input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            {demoCode && (
              <p className="mt-2 rounded-lg bg-[var(--accent-soft)] p-2 text-xs text-[var(--accent)]">
                Demo mode: email delivery isn't configured, so here is your code: <strong>{demoCode}</strong>
              </p>
            )}
          </div>
        )}
        {mode !== "reset-request" && (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-[var(--text-dim)]">
              {mode === "reset-confirm" ? "New password" : "Password"}
            </label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} required />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
            {error}
          </p>
        )}

        <button className="btn btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset-request" ? "Send reset code" : "Set new password"}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-center text-sm">
        {mode === "signin" && (
          <>
            <button className="text-[var(--text-dim)] hover:text-[var(--text)]" onClick={() => { setMode("reset-request"); setError(null); }}>
              Forgot your password?
            </button>
            <p className="text-[var(--text-dim)]">
              New here?{" "}
              <button className="font-bold text-[var(--accent)]" onClick={() => { setMode("signup"); setError(null); }}>
                Create an account
              </button>
            </p>
          </>
        )}
        {mode === "signup" && (
          <p className="text-[var(--text-dim)]">
            Already have an account?{" "}
            <button className="font-bold text-[var(--accent)]" onClick={() => { setMode("signin"); setError(null); }}>
              Sign in
            </button>
          </p>
        )}
        {(mode === "reset-request" || mode === "reset-confirm") && (
          <button className="text-[var(--text-dim)] hover:text-[var(--text)]" onClick={() => { setMode("signin"); setError(null); setDemoCode(null); }}>
            Back to sign in
          </button>
        )}
        <p className="pt-2 text-xs text-[var(--text-faint)]">
          Or keep browsing as a <Link href="/" className="underline-offset-2 hover:underline">guest</Link> — your
          likes and playlists stay on this device.
        </p>
      </div>
    </div>
  );
}
