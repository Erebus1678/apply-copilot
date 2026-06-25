import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application } from "@/db/schema";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/applications/status";

function fitVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "destructive";
}

type Props = {
  app: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
};

export function ApplicationCard({ app, onStatusChange, onDelete }: Props) {
  return (
    <article className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate leading-tight font-medium">{app.role}</span>
          <span className="text-muted-foreground truncate text-sm">{app.company}</span>
        </div>
        {typeof app.fitScore === "number" && (
          <Badge variant={fitVariant(app.fitScore)}>Fit {app.fitScore}</Badge>
        )}
      </div>

      {app.notes && <p className="text-muted-foreground line-clamp-2 text-xs">{app.notes}</p>}

      {app.jobUrl && (
        <a
          href={app.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary truncate text-xs hover:underline"
        >
          {app.jobUrl}
        </a>
      )}

      <div className="flex items-center justify-between gap-2">
        <label className="sr-only" htmlFor={`status-${app.id}`}>
          Status for {app.role}
        </label>
        <select
          id={`status-${app.id}`}
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
          className="border-input bg-background focus-visible:ring-ring rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(app.id)}
          aria-label={`Delete ${app.role} at ${app.company}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
