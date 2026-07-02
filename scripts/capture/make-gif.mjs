// Converts the Playwright demo recording (scripts/capture/.artifacts/**/*.webm)
// into an optimized GIF at docs/screenshots/analyze-demo.gif using ffmpeg's
// two-pass palette (palettegen → paletteuse) for clean colors at a small size.
// Runs after `playwright test` in the `pnpm capture` script.
import { readdirSync, statSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ART = "scripts/capture/.artifacts";
const OUT = "docs/screenshots";
const GIF = join(OUT, "analyze-demo.gif");
const PALETTE = join(ART, "palette.png");
const FILTERS = "fps=12,scale=1000:-1:flags=lanczos";
// Keep only the last N seconds: the flow's tail (typing → result → hold) is the
// content, while the head is the dev server's cold-compile blank. Trimming from
// the end is robust to however long that compile took.
const TAIL = ["-sseof", "-5.5"];

/** Newest .webm anywhere under the artifacts dir (Playwright nests per-test). */
function findVideo(dir) {
  let best = null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findVideo(full);
      if (nested && (!best || statSync(nested).mtimeMs > statSync(best).mtimeMs)) best = nested;
    } else if (entry.name.endsWith(".webm")) {
      if (!best || statSync(full).mtimeMs > statSync(best).mtimeMs) best = full;
    }
  }
  return best;
}

const video = findVideo(ART);
if (!video) {
  console.error(`[make-gif] No .webm found under ${ART}. Run the capture first.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
console.log(`[make-gif] source: ${video}`);

execFileSync("ffmpeg", ["-y", ...TAIL, "-i", video, "-vf", `${FILTERS},palettegen`, PALETTE], {
  stdio: "inherit",
});
execFileSync(
  "ffmpeg",
  ["-y", ...TAIL, "-i", video, "-i", PALETTE, "-lavfi", `${FILTERS}[x];[x][1:v]paletteuse`, GIF],
  { stdio: "inherit" },
);
rmSync(PALETTE, { force: true });

console.log(`[make-gif] wrote ${GIF}`);
