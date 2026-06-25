/** Local, device-only CV persistence (no DB until Phase 4). */
export const CV_STORAGE_KEY = "apply-copilot:cv";

export function loadCv(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CV_STORAGE_KEY) ?? "";
}

export function saveCv(value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CV_STORAGE_KEY, value);
}
