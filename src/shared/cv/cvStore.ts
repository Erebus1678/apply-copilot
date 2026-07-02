import { useEffect, useSyncExternalStore } from "react";
import { del, get, set } from "idb-keyval";
import { useActiveProfile } from "@/shared/profile/useProfileStore";
import type { LayoutReport } from "@/lib/cv/layout";

// The app-level CV, shared across CV-check / Analyze / Cover-letter. It is either
// an uploaded file (the source of truth — we show its real preview) or pasted
// text. `text`/`layout` are what the AI receives; `file` is kept so the preview
// survives navigation and reloads. Persisted per profile in IndexedDB.
export type StoredCv = {
  kind: "file" | "text";
  text: string;
  layout: LayoutReport | null;
  file: File | null;
};

type Snapshot = { profileId: string; cv: StoredCv | null; loading: boolean };

const DEFAULT_PROFILE = "default";
const keyFor = (profileId: string) => `cv:${profileId}`;
const TEXT_PERSIST_DELAY = 400;

let current: Snapshot = { profileId: "", cv: null, loading: false };
const cache = new Map<string, StoredCv | null>(); // profiles already read from IDB
const listeners = new Set<() => void>();
let textTimer: ReturnType<typeof setTimeout> | null = null;

function commit(next: Snapshot) {
  current = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return current;
}

const SERVER_SNAPSHOT: Snapshot = { profileId: "", cv: null, loading: false };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

async function persist(profileId: string, cv: StoredCv | null) {
  cache.set(profileId, cv);
  try {
    if (cv) await set(keyFor(profileId), cv);
    else await del(keyFor(profileId));
  } catch {
    // IDB unavailable (private mode / quota) — degrade to in-memory only.
  }
}

async function hydrate(profileId: string) {
  if (cache.has(profileId)) {
    commit({ profileId, cv: cache.get(profileId) ?? null, loading: false });
    return;
  }
  commit({ profileId, cv: null, loading: true });
  let loaded: StoredCv | null = null;
  try {
    loaded = (await get<StoredCv>(keyFor(profileId))) ?? null;
  } catch {
    loaded = null;
  }
  // A setter may have run while we awaited IDB — that user action wins over the
  // (now stale) stored value, so never clobber a cache populated meanwhile.
  if (cache.has(profileId)) {
    if (current.profileId === profileId && current.loading) {
      commit({ profileId, cv: cache.get(profileId) ?? null, loading: false });
    }
    return;
  }
  cache.set(profileId, loaded);
  if (current.profileId === profileId) commit({ profileId, cv: loaded, loading: false });
}

function selectProfile(profileId: string) {
  if (current.profileId === profileId) return;
  void hydrate(profileId);
}

function setUpload(profileId: string, file: File, text: string, layout: LayoutReport | null) {
  const cv: StoredCv = { kind: "file", text, layout, file };
  cache.set(profileId, cv);
  if (current.profileId === profileId) commit({ profileId, cv, loading: false });
  void persist(profileId, cv);
}

function setText(profileId: string, text: string) {
  const cv: StoredCv | null = text.trim() ? { kind: "text", text, layout: null, file: null } : null;
  cache.set(profileId, cv);
  if (current.profileId === profileId) commit({ profileId, cv, loading: false });
  // Debounce the IDB write so typing doesn't hammer storage.
  if (textTimer) clearTimeout(textTimer);
  textTimer = setTimeout(() => void persist(profileId, cv), TEXT_PERSIST_DELAY);
}

function clear(profileId: string) {
  cache.set(profileId, null);
  if (current.profileId === profileId) commit({ profileId, cv: null, loading: false });
  void persist(profileId, null);
}

/** The current profile's CV plus mutators. Shared across every tool that needs it. */
export function useCurrentCv() {
  const profileId = useActiveProfile() || DEFAULT_PROFILE;
  useEffect(() => {
    selectProfile(profileId);
  }, [profileId]);

  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isCurrent = snap.profileId === profileId;
  return {
    cv: isCurrent ? snap.cv : null,
    loading: isCurrent ? snap.loading : true,
    setUpload: (file: File, text: string, layout: LayoutReport | null) =>
      setUpload(profileId, file, text, layout),
    setText: (text: string) => setText(profileId, text),
    clear: () => clear(profileId),
  };
}
