import { useState } from "react";
import type { Application } from "@/db/schema";
import type { ApplicationStatus } from "@/lib/applications/status";

/**
 * Drag-and-drop state for the board columns. Owns the dragged card id and the
 * hovered column; calls `onMove(id, status)` only when a card is dropped on a
 * *different* column. Rendering stays in BoardView.
 */
export function useBoardDragDrop(
  apps: Application[],
  onMove: (id: string, status: ApplicationStatus) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);

  function onDragStart(id: string): void {
    setDragId(id);
  }

  function onDragEnd(): void {
    setDragId(null);
    setDragOver(null);
  }

  function onColumnDragOver(status: ApplicationStatus): void {
    if (!dragId) return;
    if (dragOver !== status) setDragOver(status);
  }

  function onColumnDrop(status: ApplicationStatus): void {
    const id = dragId;
    setDragId(null);
    setDragOver(null);
    if (!id) return;
    const app = apps.find((a) => a.id === id);
    if (app && app.status !== status) onMove(id, status);
  }

  return { dragId, dragOver, setDragOver, onDragStart, onDragEnd, onColumnDragOver, onColumnDrop };
}
