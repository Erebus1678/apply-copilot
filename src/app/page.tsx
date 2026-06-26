import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A real sequence — the application workflow — so the numbering carries meaning.
const steps = [
  {
    n: "01",
    label: "Analyze",
    href: "/analyze",
    desc: "Paste a JD → tech stack, seniority, archetype.",
  },
  {
    n: "02",
    label: "Score",
    href: "/analyze",
    desc: "Match it against your CV with concrete gaps.",
  },
  {
    n: "03",
    label: "Draft",
    href: "/cover-letter",
    desc: "A tailored cover letter, streamed, no slop.",
  },
  { n: "04", label: "Track", href: "/board", desc: "Every role on one persistent job tracker." },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="dot-grid border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-6 py-24 sm:py-32">
          <p className="eyebrow reveal flex items-center gap-2" style={{ animationDelay: "0ms" }}>
            <span className="bg-signal live-dot size-1.5 rounded-full" />
            Local-first · private by default
          </p>

          <h1
            className="reveal max-w-3xl text-5xl leading-[0.98] font-semibold tracking-tight text-balance sm:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            The copilot for landing your next role.
          </h1>

          <p
            className="text-muted-foreground reveal max-w-xl text-lg text-pretty"
            style={{ animationDelay: "130ms" }}
          >
            Turn a job description into a fit score, a gap list, and a drafted cover letter — then
            track every application in one place. Runs on your own model; nothing has to leave your
            machine.
          </p>

          <div
            className="reveal flex flex-wrap items-center gap-4"
            style={{ animationDelay: "200ms" }}
          >
            <Link href="/analyze" className={cn(buttonVariants({ size: "lg" }))}>
              Start with a job description
            </Link>
            <Link
              href="/board"
              className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
            >
              Open the job tracker →
            </Link>
          </div>
        </div>
      </section>

      <section
        className="reveal mx-auto grid w-full max-w-6xl grid-cols-1 border-b sm:grid-cols-2 lg:grid-cols-4"
        style={{ animationDelay: "280ms" }}
        aria-label="How it works"
      >
        {steps.map(({ n, label, href, desc }) => (
          <Link
            key={n}
            href={href}
            className="group hover:bg-accent/40 focus-visible:ring-ring flex flex-col gap-3 border-t px-6 py-8 transition-colors outline-none focus-visible:ring-2 lg:border-l lg:first:border-l-0"
          >
            <span className="text-muted-foreground/70 font-mono text-xs">{n}</span>
            <span className="flex items-center gap-1 text-base font-semibold">
              <span>{label}</span>
              <span className="text-primary inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
            <span className="text-muted-foreground text-sm">{desc}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
