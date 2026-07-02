"use client";

import { useSyncExternalStore } from "react";

const KEY = "apply-copilot:profile";
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

/** Set the active local profile (its server id). "" clears it. */
export function setActiveProfile(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // persistence optional
  }
  for (const listener of listeners) listener();
}

/** The active profile id, or "" before one is chosen. */
export function useActiveProfile(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
