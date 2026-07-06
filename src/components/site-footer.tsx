export function SiteFooter() {
  return (
    <footer className="border-border/80 mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-foreground font-medium">Apply Copilot</span>, private by default,
          runs on your own model.
        </p>
        <p className="text-xs">Built with Next.js · React · Postgres</p>
      </div>
    </footer>
  );
}
