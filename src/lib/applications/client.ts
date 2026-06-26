import type { Application } from "@/db/schema";
import type { CreateApplicationInput, UpdateApplicationInput } from "./schemas";

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.toString?.() ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchApplications(profileId?: string): Promise<Application[]> {
  const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  const res = await fetch(`/api/applications${query}`);
  const body = await parseOrThrow<{ data: Application[] }>(res);
  return body.data;
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow<{ data: Application }>(res);
  return body.data;
}

export async function importApplications(
  rows: CreateApplicationInput[],
  profileId?: string,
): Promise<Application[]> {
  const res = await fetch("/api/applications/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profileId, applications: rows }),
  });
  const body = await parseOrThrow<{ data: Application[] }>(res);
  return body.data;
}

export async function patchApplication(
  id: string,
  patch: UpdateApplicationInput,
): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await parseOrThrow<{ data: Application }>(res);
  return body.data;
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete (${res.status})`);
  }
}
