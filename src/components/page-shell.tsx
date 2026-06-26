import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/page-heading";

type Props = {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  /** Wider canvas for grid/dashboard pages (e.g. the kanban board). */
  wide?: boolean;
  children: ReactNode;
};

// Single source of truth for every content page's outer shell, so centering,
// padding, and width stay consistent across routes instead of drifting per page.
export function PageShell({ eyebrow, title, intro, wide = false, children }: Props) {
  return (
    <main
      className={cn(
        "reveal mx-auto flex w-full flex-col gap-8 px-6 py-16",
        wide ? "max-w-6xl" : "max-w-5xl",
      )}
    >
      <PageHeading eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeading>
      {children}
    </main>
  );
}
