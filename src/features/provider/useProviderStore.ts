"use client";

import { useSyncExternalStore } from "react";
import { PROVIDER_IDS, type ProviderId } from "@/lib/ai/config";

const KEY = "apply-copilot:provider";
const listeners = new Set<() => void>();

function isProvider(value: string | null): value is ProviderId {
  return value !== null && (PROVIDER_IDS as readonly string[]).includes(value);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): ProviderId {
  const stored = localStorage.getItem(KEY);
  return isProvider(stored) ? stored : "local";
}

// SSR always starts from the local default; useSyncExternalStore reconciles to
// the client value after hydration without a mismatch.
function getServerSnapshot(): ProviderId {
  return "local";
}

export function setProvider(provider: ProviderId): void {
  try {
    localStorage.setItem(KEY, provider);
  } catch {
    // Persistence is optional (private mode / quota).
  }
  for (const listener of listeners) listener();
}

export function useProvider(): ProviderId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
