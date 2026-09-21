"use client";
import Image from "next/image";
import { Disc3, Mic2, Music2, WifiOff } from "lucide-react";
import { useState } from "react";
import { cn, hueFromString } from "@/lib/utils";

/** Album/video artwork with graceful fallback. */
export function Artwork({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  sizes = "200px",
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [err, setErr] = useState(false);
  const hue = hueFromString(alt);
  if (!src || err) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("relative overflow-hidden", className)}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 40% 26%), hsl(${(hue + 60) % 360} 45% 16%))`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white/40">
          <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-[var(--s2)]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        onError={() => setErr(true)}
        className={cn("object-cover", imgClassName)}
      />
    </div>
  );
}

/** Circular artist avatar — photo if available, otherwise monogram. */
export function ArtistAvatar({
  name,
  src,
  className,
  sizes = "120px",
}: {
  name: string;
  src?: string;
  className?: string;
  sizes?: string;
}) {
  const hue = hueFromString(name);
  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-full bg-[var(--s2)]", className)}>
        <Image src={src} alt={name} fill sizes={sizes} className="object-cover" loading="lazy" />
      </div>
    );
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden rounded-full", className)}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 55% 38%), hsl(${(hue + 50) % 360} 60% 22%))`,
      }}
      aria-hidden
    >
      <span className="font-display font-bold text-white/85" style={{ fontSize: "38%" }}>
        {initials}
      </span>
    </div>
  );
}

/** Generated playlist cover from a hue or name. */
export function GeneratedCover({
  seed,
  className,
  icon = true,
}: {
  seed: string;
  className?: string;
  icon?: boolean;
}) {
  const hue = hueFromString(seed);
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 60% 40%), hsl(${(hue + 70) % 360} 55% 20%))`,
      }}
      aria-hidden
    >
      {icon && <Music2 className="h-1/3 w-1/3 text-white/50" strokeWidth={1.5} />}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(var(--grid-min), 1fr))" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fade-up flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--text-faint)]">
        {icon ?? <Disc3 className="h-7 w-7" strokeWidth={1.5} />}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-[var(--text-dim)]">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="fade-up flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--text-faint)]">
        <WifiOff className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-[var(--text-dim)]">{body}</p>}
      {onRetry && (
        <button className="btn btn-ghost mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ArtistGlyph() {
  return <Mic2 className="h-4 w-4" />;
}
