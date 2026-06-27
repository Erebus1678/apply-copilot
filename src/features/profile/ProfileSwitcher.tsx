"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/db/schema";
import { createProfile, fetchProfiles, renameProfile } from "@/lib/profiles/client";
import { cn } from "@/lib/utils";
import { setActiveProfile, useActiveProfile } from "./useProfileStore";

export function ProfileSwitcher() {
  const active = useActiveProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newPerson, setNewPerson] = useState("");
  const [trackParent, setTrackParent] = useState<string | null>(null);
  const [trackName, setTrackName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Load profiles once (the endpoint guarantees at least a default exists).
  useEffect(() => {
    let alive = true;
    fetchProfiles()
      .then((list) => alive && setProfiles(list))
      .catch(() => {
        // best-effort; the board still works unscoped
      });
    return () => {
      alive = false;
    };
  }, []);

  // Reconcile the active profile against the loaded list. Auto-pick ONLY when
  // there's a single profile; with several, require an explicit choice so a
  // shared device doesn't silently open someone else's profile/track.
  useEffect(() => {
    if (profiles.length === 0) return;
    if (profiles.some((p) => p.id === active)) return;
    if (profiles.length === 1) setActiveProfile(profiles[0].id);
    else if (active) setActiveProfile("");
  }, [profiles, active]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function create(name: string, parentId?: string) {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const created = await createProfile(
        parentId ? { name: trimmed, parentId } : { name: trimmed },
      );
      setProfiles((prev) => [...prev, created]);
      setActiveProfile(created.id);
      setNewPerson("");
      setTrackName("");
      setTrackParent(null);
    } catch {
      // keep the form open for a retry
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await renameProfile(id, name);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      // ignore — keep the field open for a retry
    }
    setEditingId(null);
  }

  const persons = profiles.filter((p) => !p.parentId);
  const tracksOf = (id: string) => profiles.filter((p) => p.parentId === id);

  const activeProfile = profiles.find((p) => p.id === active);
  const activeParent = activeProfile?.parentId
    ? profiles.find((p) => p.id === activeProfile.parentId)
    : null;
  const activeLabel = activeProfile
    ? activeParent
      ? `${activeParent.name} ▸ ${activeProfile.name}`
      : activeProfile.name
    : "Profile";

  function row(p: Profile) {
    if (editingId === p.id) {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleRename(p.id);
          }}
          className="flex min-w-0 flex-1 gap-1"
        >
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            aria-label={`Rename ${p.name}`}
            maxLength={80}
            autoFocus
            className="border-border bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-2"
          />
          <button
            type="submit"
            className="border-border shrink-0 rounded-md border px-2 py-1 text-xs font-medium"
          >
            Save
          </button>
        </form>
      );
    }
    return (
      <>
        <button
          type="button"
          role="menuitemradio"
          aria-checked={p.id === active}
          onClick={() => setActiveProfile(p.id)}
          className={cn(
            "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            p.id === active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
          )}
        >
          {p.name}
        </button>
        <button
          type="button"
          aria-label={`Rename ${p.name}`}
          onClick={() => {
            setEditingId(p.id);
            setEditName(p.name);
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-md px-1.5 py-1 text-xs"
        >
          ✎
        </button>
      </>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-muted/60 hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
      >
        <span aria-hidden="true">◓</span>
        <span className="max-w-40 truncate">{activeLabel}</span>
        <span className="text-muted-foreground" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile"
          className="border-border bg-background absolute right-0 z-20 mt-2 w-64 rounded-lg border p-2 shadow-lg"
        >
          <ul className="flex flex-col gap-0.5">
            {persons.map((person) => (
              <li key={person.id} className="flex flex-col">
                <div className="flex items-center gap-1">
                  {row(person)}
                  {editingId !== person.id && (
                    <button
                      type="button"
                      aria-label={`Add track to ${person.name}`}
                      onClick={() => {
                        setTrackParent(person.id);
                        setTrackName("");
                      }}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-md px-1.5 py-1 text-xs"
                    >
                      ＋
                    </button>
                  )}
                </div>

                {tracksOf(person.id).length > 0 && (
                  <ul className="border-border ml-3 flex flex-col gap-0.5 border-l pl-2">
                    {tracksOf(person.id).map((track) => (
                      <li key={track.id} className="flex items-center gap-1">
                        {row(track)}
                      </li>
                    ))}
                  </ul>
                )}

                {trackParent === person.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void create(trackName, person.id);
                    }}
                    className="mt-1 ml-3 flex gap-1 pl-2"
                  >
                    <input
                      type="text"
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      placeholder="New track…"
                      aria-label={`New track for ${person.name}`}
                      maxLength={80}
                      autoFocus
                      className="border-border bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={busy || !trackName.trim()}
                      className="border-border rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
                    >
                      Add
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create(newPerson);
            }}
            className="border-border mt-2 flex gap-2 border-t pt-2"
          >
            <input
              type="text"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              placeholder="New profile…"
              aria-label="New profile name"
              maxLength={80}
              className="border-border bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2"
            />
            <button
              type="submit"
              disabled={busy || !newPerson.trim()}
              className="border-border rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
