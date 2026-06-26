"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Application } from "@/db/schema";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  importApplications,
  patchApplication,
} from "@/lib/applications/client";
import { parseImportFile } from "@/lib/applications/import";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/applications/status";
import { useActiveProfile } from "@/features/profile/useProfileStore";
import { ApplicationCard } from "./ApplicationCard";

export function BoardView() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [adding, setAdding] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileId = useActiveProfile();
  const profileIdRef = useRef(profileId);
  useEffect(() => {
    profileIdRef.current = profileId;
  }, [profileId]);

  useEffect(() => {
    let active = true;
    fetchApplications(profileId || undefined)
      .then((data) => active && setApps(data))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setAdding(true);
    setError("");
    try {
      const created = await createApplication({
        company: company.trim(),
        role: role.trim(),
        status: "saved",
        profileId: profileId || undefined,
      });
      setApps((prev) => [created, ...prev]);
      setCompany("");
      setRole("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add application");
    } finally {
      setAdding(false);
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-selected
    if (!file) return;
    setError("");
    setImportMsg("");
    try {
      const { rows, errors } = parseImportFile(await file.text(), file.name);
      if (rows.length === 0) {
        setError(errors[0] ?? "No valid applications found in that file");
        return;
      }
      const created = await importApplications(rows, profileIdRef.current || undefined);
      setApps((prev) => [...created, ...prev]);
      setImportMsg(
        `Imported ${created.length}${errors.length ? `, skipped ${errors.length}` : ""}.`,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    const snapshot = apps;
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await patchApplication(id, { status });
    } catch {
      setApps(snapshot);
      setError("Could not update status");
    }
  }

  async function handleDelete(id: string) {
    const snapshot = apps;
    setApps((cur) => cur.filter((a) => a.id !== id));
    try {
      await deleteApplication(id);
    } catch {
      setApps(snapshot);
      setError("Could not delete application");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="company" className="text-sm font-medium">
            Company
          </label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={adding || !company.trim() || !role.trim()}>
            {adding ? "Adding…" : "Add"}
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="Import applications from a CSV or JSON file"
          />
        </div>
      </form>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {importMsg && (
        <p className="text-muted-foreground text-sm" role="status">
          {importMsg}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading your job tracker…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {APPLICATION_STATUSES.map((status) => {
            const column = apps.filter((a) => a.status === status);
            return (
              <section
                key={status}
                className="flex flex-col gap-3"
                aria-label={STATUS_LABELS[status]}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {column.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {column.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
