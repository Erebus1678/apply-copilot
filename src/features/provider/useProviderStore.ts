"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PROVIDER_IDS, type ProviderId } from "@/lib/ai/config";

const KEY = "apply-copilot:provider";
const CONFIG_KEY = "apply-copilot:provider-config";
const listeners = new Set<() => void>();

export interface ProviderEntry {
  apiKey?: string;
  model?: string;
}
export type ProviderConfig = Partial<Record<ProviderId, ProviderEntry>>;

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

function notify(): void {
  for (const listener of listeners) listener();
}

// --- Active provider --------------------------------------------------------

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
  notify();
}

export function useProvider(): ProviderId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// --- Per-provider config (BYO-key + model) ----------------------------------

function readConfig(): ProviderConfig {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as ProviderConfig) : {};
  } catch {
    return {};
  }
}

function writeConfig(next: ProviderConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  } catch {
    // optional persistence
  }
  notify();
}

function setEntry(id: ProviderId, patch: ProviderEntry): void {
  const cfg = readConfig();
  const entry: ProviderEntry = { ...cfg[id], ...patch };
  // Drop empty fields so the stored object stays tidy.
  if (!entry.apiKey) delete entry.apiKey;
  if (!entry.model) delete entry.model;
  const next: ProviderConfig = { ...cfg, [id]: entry };
  if (!entry.apiKey && !entry.model) delete next[id];
  writeConfig(next);
}

export function setProviderKey(id: ProviderId, apiKey: string): void {
  setEntry(id, { apiKey: apiKey.trim() || undefined });
}

export function setProviderModel(id: ProviderId, model: string): void {
  setEntry(id, { model: model.trim() || undefined });
}

// The snapshot is the raw JSON string (stable per content) so useSyncExternalStore
// doesn't loop; the parsed object is memoized off it.
function getConfigSnapshot(): string {
  return localStorage.getItem(CONFIG_KEY) ?? "{}";
}

function getConfigServerSnapshot(): string {
  return "{}";
}

export function useProviderConfig(): ProviderConfig {
  const raw = useSyncExternalStore(subscribe, getConfigSnapshot, getConfigServerSnapshot);
  return useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? (parsed as ProviderConfig) : {};
    } catch {
      return {};
    }
  }, [raw]);
}

/** Build the per-request override (provider + any BYO key/model) for a provider. */
export function overrideFor(
  provider: ProviderId,
  config: ProviderConfig,
): { provider: ProviderId; apiKey?: string; model?: string } {
  const entry = config[provider];
  return { provider, apiKey: entry?.apiKey, model: entry?.model };
}
