"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/db/schema";
import { createProfile, fetchProfiles } from "@/lib/profiles/client";
import { cn } from "@/lib/utils";
import { setActiveProfile, useActiveProfile } from "./useProfileStore";

export function ProfileSwitcher() {
  const active = useActiveProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
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
  // there's a single profile (no ambiguity) — with several, require an explicit
  // choice so a shared device (e.g. on a LAN) doesn't silently open someone
  // else's profile. A stale id (deleted profile) is cleared so the user re-picks.
  // The choice is remembered per device via localStorage in useProfileStore.
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

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const created = await createProfile({ name });
      setProfiles((prev) => [...prev, created]);
      setActiveProfile(created.id);
      setNewName("");
    } catch {
      // ignore — keep the form open for a retry
    } finally {
      setBusy(false);
    }
  }

  const activeName = profiles.find((p) => p.id === active)?.name ?? "Profile";

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
        <span className="max-w-24 truncate">{activeName}</span>
        <span className="text-muted-foreground" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile"
          className="border-border bg-background absolute right-0 z-20 mt-2 w-56 rounded-lg border p-2 shadow-lg"
        >
          <ul className="flex flex-col">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === active}
                  onClick={() => setActiveProfile(p.id)}
                  className={cn(
                    "w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    p.id === active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleCreate} className="border-border mt-2 flex gap-2 border-t pt-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New profile…"
              aria-label="New profile name"
              maxLength={80}
              className="border-border bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2"
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
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
