import type { Profile } from "@/db/schema";
import type { CreateProfileInput } from "./schemas";

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.toString?.() ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch("/api/profiles");
  const body = await parseOrThrow<{ data: Profile[] }>(res);
  return body.data;
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow<{ data: Profile }>(res);
  return body.data;
}

export async function renameProfile(id: string, name: string): Promise<Profile> {
  const res = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = await parseOrThrow<{ data: Profile }>(res);
  return body.data;
}
