import Link from "next/link";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/cover-letter", label: "Cover letter" },
  { href: "/board", label: "Pipeline" },
];

export function SiteNav() {
  return (
    <header className="border-border/80 sticky top-0 z-10 border-b backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5"
      >
        <Link href="/" className="font-semibold tracking-tight">
          Apply<span className="text-primary">Copilot</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-3 py-1.5 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
