"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Application } from "@/db/schema";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  importApplications,
  patchApplication,
} from "@/lib/applications/client";
import { parseImportFile, summarizeSkipped } from "@/lib/applications/import";
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
  const [salary, setSalary] = useState("");
  const [grade, setGrade] = useState("");
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileId = useActiveProfile();
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
        salary: salary.trim() || undefined,
        grade: grade.trim() || undefined,
        profileId: profileId || undefined,
      });
      setApps((prev) => [created, ...prev]);
      setCompany("");
      setRole("");
      setSalary("");
      setGrade("");
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

  function handleDrop(status: ApplicationStatus) {
    const id = dragId;
    setDragId(null);
    setDragOver(null);
    if (!id) return;
    const app = apps.find((a) => a.id === id);
    if (app && app.status !== status) void handleStatusChange(id, status);
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

  if (!profileId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select your profile in the top-right to start tracking applications.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5 sm:min-w-40">
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
        <div className="flex flex-1 flex-col gap-1.5 sm:min-w-40">
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
        <div className="flex flex-col gap-1.5 sm:w-32">
          <label htmlFor="grade" className="text-sm font-medium">
            Grade
          </label>
          <Input
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Senior"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-32">
          <label htmlFor="salary" className="text-sm font-medium">
            Expected pay
          </label>
          <Input
            id="salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="$90–110k"
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
                className={cn(
                  "flex flex-col gap-3 rounded-lg border border-transparent p-1 transition-colors",
                  dragOver === status && "border-primary/60 bg-accent/40",
                )}
                aria-label={STATUS_LABELS[status]}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault(); // allow drop
                  if (dragOver !== status) setDragOver(status);
                }}
                onDragLeave={(e) => {
                  // Only clear when leaving the column itself, not moving onto a child.
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(status);
                }}
              >
                <div className="flex items-center justify-between px-1">
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
                      onDragStart={setDragId}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                      }}
                      dragging={dragId === app.id}
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
