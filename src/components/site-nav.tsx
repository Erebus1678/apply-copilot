"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProviderSwitcher } from "@/features/provider/ProviderSwitcher";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/cv", label: "CV check" },
  { href: "/cover-letter", label: "Cover letter" },
  { href: "/board", label: "Job Tracker" },
  { href: "/stats", label: "Stats" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link href="/" aria-label="Apply Copilot — home" className="font-semibold tracking-tight">
          Apply<span className="text-primary">Copilot</span>
        </Link>

        <div className="flex items-center gap-1 text-sm">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ProviderSwitcher />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
