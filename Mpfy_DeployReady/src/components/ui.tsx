"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToasts } from "@/state/toasts";

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  sheet = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
  sheet?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className={cn("fixed inset-0 z-[70] flex", sheet ? "items-end justify-center" : "items-center justify-center p-4")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close dialog"
        className="fade-in absolute inset-0 cursor-default bg-[var(--scrim)]"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={ref}
        className={cn(
          "scale-in relative max-h-[86vh] w-full overflow-y-auto border border-[var(--line)] bg-[var(--s1)] shadow-[var(--shadow)]",
          wide ? "max-w-2xl" : "max-w-md",
          sheet ? "rounded-t-[24px] pb-[env(safe-area-inset-bottom)]" : "rounded-[var(--radius-lg)]"
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--s1)]/95 px-5 py-4 backdrop-blur">
            <h2 className="font-display text-base font-bold">{title}</h2>
            <button className="icon-btn h-8 w-8" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Dropdown menu ---------------- */
export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  onClick: () => void;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  ariaLabel = "Menu",
}: {
  trigger: React.ReactNode;
  items: MenuItem[] | (() => MenuItem[]);
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = typeof items === "function" ? (open ? items() : []) : items;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        className="icon-btn h-8 w-8"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "scale-in absolute z-50 mt-1 min-w-[220px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--s2)] py-1.5 shadow-[var(--shadow)]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {list.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : item.active
                    ? "text-[var(--accent)] hover:bg-[var(--s3)]"
                    : "text-[var(--text)] hover:bg-[var(--s3)]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.icon && <span className="text-[var(--text-dim)] [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Toasts ---------------- */
export function ToastViewport() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="pointer-events-none fixed bottom-[calc(var(--player-h)+16px)] left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 max-md:bottom-24">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            "sheet-up glass pointer-events-auto w-full rounded-[var(--radius-md)] border px-4 py-3 text-left shadow-[var(--shadow-sm)]",
            t.kind === "error" ? "border-red-500/40" : t.kind === "success" ? "border-emerald-500/40" : "border-[var(--line)]"
          )}
          role="status"
        >
          <p className="text-sm font-bold">{t.title}</p>
          {t.body && <p className="mt-0.5 text-xs text-[var(--text-dim)]">{t.body}</p>}
        </button>
      ))}
    </div>,
    document.body
  );
}

/** True after the first client render — use to avoid hydration mismatches
 *  with localStorage-persisted stores. */
export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

/* ---------------- Section header ---------------- */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--text-dim)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
