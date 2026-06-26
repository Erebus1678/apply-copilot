/** A small live "the model is working" affordance, in the machine's mono voice. */
export function StreamingIndicator({ label = "Streaming…" }: { label?: string }) {
  return (
    <span
      role="status"
      className="text-muted-foreground inline-flex items-center gap-2 font-mono text-xs"
    >
      <span className="bg-signal live-dot size-1.5 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}
