import { useEffect, useRef, useState } from "react";
import type { Application } from "@/db/schema";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  importApplications,
  patchApplication,
} from "@/lib/applications/client";
import { parseImportFile, summarizeSkipped } from "@/lib/applications/import";
import type { ApplicationStatus } from "@/lib/applications/status";

type CreateInput = Parameters<typeof createApplication>[0];

/**
 * All board data + persistence: load on profile change, and optimistic
 * create/status/delete/import with rollback on failure. UI (form fields,
 * drag state, layout) stays in BoardView.
 */
export function useBoardData(profileId: string) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importMsg, setImportMsg] = useState("");

  // Keep the latest profileId for async callbacks without re-binding them.
  const profileIdRef = useRef(profileId);
  useEffect(() => {
    profileIdRef.current = profileId;
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return; // no profile chosen yet — don't load anyone's data
    let active = true;
    fetchApplications(profileId)
      .then((data) => active && setApps(data))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId]);

  async function add(input: Omit<CreateInput, "profileId">): Promise<void> {
    setError("");
    const created = await createApplication({ ...input, profileId: profileId || undefined });
    setApps((prev) => [created, ...prev]);
  }

  async function changeStatus(id: string, status: ApplicationStatus): Promise<void> {
    const snapshot = apps;
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await patchApplication(id, { status });
    } catch {
      setApps(snapshot);
      setError("Could not update status");
    }
  }

  async function remove(id: string): Promise<void> {
    const snapshot = apps;
    setApps((cur) => cur.filter((a) => a.id !== id));
    try {
      await deleteApplication(id);
    } catch {
      setApps(snapshot);
      setError("Could not delete application");
    }
  }

  async function importFile(file: File): Promise<void> {
    setError("");
    setImportMsg("");
    try {
      const { rows, errors } = parseImportFile(await file.text(), file.name);
      if (rows.length === 0) {
        const detail = summarizeSkipped(errors);
        setError(
          detail ? `No valid applications: ${detail}` : "No valid applications in that file",
        );
        return;
      }
      const created = await importApplications(rows, profileIdRef.current || undefined);
      setApps((prev) => [...created, ...prev]);
      const skipped = errors.length
        ? `, skipped ${errors.length} (${summarizeSkipped(errors)})`
        : "";
      setImportMsg(`Imported ${created.length}${skipped}.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }

  return { apps, loading, error, importMsg, setError, add, changeStatus, remove, importFile };
}
