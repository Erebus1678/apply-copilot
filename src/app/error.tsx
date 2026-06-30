"use client";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Without it, any client render error (e.g. a provider
 * returning something the streamed views choke on) takes the whole page down.
 * This catches it and offers a recoverable "Try again" instead.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-20">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        That action hit an unexpected error. Your saved data is safe. Try again — or if this
        happened during a generation, switch the AI provider or model in the header and retry.
      </p>
      {error.message && (
        <pre className="border-border text-muted-foreground max-w-full overflow-auto rounded-md border p-3 text-xs">
          {error.message}
        </pre>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
