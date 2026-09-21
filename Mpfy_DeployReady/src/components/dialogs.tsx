"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink, ListMusic, Plus } from "lucide-react";
import { Modal } from "./ui";
import { GeneratedCover, Artwork } from "./media";
import { useDialogs } from "@/state/dialogs";
import { useLibrary } from "@/state/library";
import { usePlayer } from "@/state/player";
import { toast } from "@/state/toasts";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/types/music";

function PlaylistRow({ pl, onPick }: { pl: Playlist; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="row-hover flex w-full items-center gap-3 p-2 text-left"
    >
      {pl.cover || (pl.tracks.length > 0 && pl.tracks[0]?.artwork) ? (
        <Artwork
          src={pl.cover ?? pl.tracks[0]?.artwork}
          alt={pl.name}
          className="h-12 w-12 rounded-lg"
          sizes="48px"
        />
      ) : (
        <GeneratedCover seed={pl.name} className="h-12 w-12 rounded-lg" icon={false} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{pl.name}</p>
        <p className="truncate text-xs text-[var(--text-dim)]">
          {pl.tracks.length} {pl.tracks.length === 1 ? "song" : "songs"}
        </p>
      </div>
      <ListMusic className="h-4 w-4 text-[var(--text-faint)]" />
    </button>
  );
}

export function DialogHost() {
  const { addToTrack, saveQueueOpen, share, closeAll } = useDialogs();
  const library = useLibrary();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const close = () => {
    setCreating(false);
    setNewName("");
    closeAll();
  };

  async function createAndAdd(track?: Parameters<typeof library.addToPlaylist>[1]) {
    if (!newName.trim()) return;
    const pl = await library.createPlaylist(newName);
    if (pl && track) await library.addToPlaylist(pl.id, track);
    close();
  }

  return (
    <>
      {/* Add to playlist */}
      <Modal open={Boolean(addToTrack)} onClose={close} title="Add to playlist">
        <div className="p-4">
          {library.playlists.length === 0 && !creating && (
            <p className="mb-3 text-sm text-[var(--text-dim)]">
              You don't have any playlists yet. Create one to save this song.
            </p>
          )}
          <div className="max-h-[40vh] space-y-1 overflow-y-auto">
            {library.playlists.map((pl) => (
              <PlaylistRow
                key={pl.id}
                pl={pl}
                onPick={async () => {
                  if (addToTrack) await library.addToPlaylist(pl.id, addToTrack);
                  close();
                }}
              />
            ))}
          </div>
          {!creating ? (
            <button
              className="btn btn-ghost mt-3 w-full"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-4 w-4" /> New playlist
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                autoFocus
                className="input"
                placeholder="Playlist name"
                value={newName}
                maxLength={60}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAdd(addToTrack ?? undefined)}
              />
              <button className="btn btn-primary" onClick={() => createAndAdd(addToTrack ?? undefined)}>
                Create
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Save queue as playlist */}
      <Modal open={saveQueueOpen} onClose={close} title="Save queue as playlist">
        <SaveQueueForm onDone={close} />
      </Modal>

      {/* Share */}
      <Modal open={Boolean(share)} onClose={close} title="Share">
        {share && (
          <div className="space-y-2 p-4">
            <p className="font-display text-lg font-bold">{share.title}</p>
            {share.subtitle && <p className="text-sm text-[var(--text-dim)]">{share.subtitle}</p>}
            <div className="mt-4 space-y-2">
              <CopyButton label="Copy Mpfy link" value={share.url} />
              {share.youtubeUrl && (
                <a
                  className="btn btn-ghost w-full"
                  href={share.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> Open on YouTube
                </a>
              )}
            </div>
            <p className="mt-4 text-xs text-[var(--text-faint)]">
              Playback is provided by YouTube's official embed player.
            </p>
          </div>
        )}
      </Modal>

    </>
  );
}

function SaveQueueForm({ onDone }: { onDone: () => void }) {
  const queue = usePlayer((s) => s.queue);
  const library = useLibrary();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const pl = await library.createPlaylist(name.trim(), "Saved from my queue");
    if (pl) {
      for (const t of queue) await library.addToPlaylist(pl.id, t);
      toast("Queue saved as playlist", { kind: "success" });
    }
    setBusy(false);
    onDone();
  }

  return (
    <div className="p-4">
      <p className="mb-3 text-sm text-[var(--text-dim)]">
        Save the current queue ({queue.length} {queue.length === 1 ? "song" : "songs"}) as a new
        playlist.
      </p>
      <div className="flex gap-2">
        <input
          autoFocus
          className="input"
          placeholder="Playlist name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <button className={cn("btn btn-primary", busy && "opacity-60")} onClick={save} disabled={busy}>
          Save
        </button>
      </div>
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-ghost w-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          toast("Couldn't copy — please copy manually", { body: value, kind: "error" });
        }
      }}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
