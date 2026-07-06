import type { Analysis } from "./analysis";

// No-key demo fixture: streamed through the real route/response pipeline so the
// UI exercises its actual code path, not a parallel fake renderer.
export const DEMO_JD =
  "Senior Frontend Engineer — we're looking for someone to lead the next generation of our " +
  "customer dashboard. You'll build streaming, real-time UIs in React and TypeScript, own our " +
  "component architecture, and mentor mid-level engineers. Requirements: 5+ years with React, " +
  "strong TypeScript, deep CSS/accessibility knowledge, and experience with performance profiling " +
  "in production. Nice to have: Next.js App Router, design systems, and GraphQL.";

export const DEMO_CV = `Dmytro — Senior Frontend Engineer, 6 years.
Built and shipped React + TypeScript dashboards handling real-time data streams.
Led a 3-person team; mentored 2 juniors to mid-level.
Strong CSS, WCAG-AA accessibility work, and Lighthouse performance audits.
Next.js App Router in production; no GraphQL experience.`;

export const DEMO_ANALYSIS: Analysis = {
  techStack: [
    { name: "React", importance: "required" },
    { name: "TypeScript", importance: "required" },
    { name: "CSS / Accessibility", importance: "required" },
    { name: "Next.js App Router", importance: "preferred" },
    { name: "GraphQL", importance: "preferred" },
  ],
  seniority: "senior",
  archetype: "Product-focused frontend engineer",
  responsibilities: [
    "Build streaming, real-time dashboard UIs",
    "Own component architecture",
    "Mentor mid-level engineers",
  ],
  fit: {
    score: 82,
    matched: ["React", "TypeScript", "CSS / accessibility", "Next.js App Router"],
    gaps: [{ item: "GraphQL", severity: "minor" }],
    summary: "Strong match: deep React/TypeScript experience with only a minor GraphQL gap.",
  },
};

/** True when the no-key demo (checked-in fixture, no provider call) is exposed. */
export function isDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

// ponytail: chunk size / delay tuned so the demo visibly streams without being
// slow to finish (~4s total for this fixture). Adjust both together.
const CHUNK_SIZE = 24;
const CHUNK_DELAY_MS = 15;

/** Streams the fixture analysis as text chunks, same shape a real textStream emits. */
export function streamDemoAnalysis(): ReadableStream<string> {
  const full = JSON.stringify(DEMO_ANALYSIS);
  let offset = 0;

  return new ReadableStream<string>({
    async pull(controller) {
      if (offset >= full.length) {
        controller.close();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
      const chunk = full.slice(offset, offset + CHUNK_SIZE);
      offset += CHUNK_SIZE;
      controller.enqueue(chunk);
    },
  });
}
