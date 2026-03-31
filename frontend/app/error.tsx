"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)] px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
          Something went wrong
        </h1>
        <p className="text-[var(--text-secondary)] mb-2 leading-relaxed">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--text-tertiary)] mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <Button size="lg" variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
