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
        // Scale the canvas up on larger displays instead of capping at 1024px.
        // `wide` (tool/grid pages) grows further than text pages.
        wide
          ? "3xl:max-w-[112rem] max-w-6xl xl:max-w-7xl 2xl:max-w-[100rem]"
          : "3xl:max-w-[100rem] max-w-5xl xl:max-w-6xl 2xl:max-w-7xl",
      )}
    >
      <PageHeading eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeading>
      {children}
    </main>
  );
}
