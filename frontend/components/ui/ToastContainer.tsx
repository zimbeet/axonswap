"use client";

import { useToast, Toast } from "@/hooks/useToast";

const EXPLORER_BASE = "https://explorer.axonchain.ai";

const ICONS: Record<Toast["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS: Record<Toast["type"], { bg: string; border: string; icon: string }> = {
  success: {
    bg: "rgba(54,255,166,0.08)",
    border: "rgba(54,255,166,0.25)",
    icon: "#36FFA6",
  },
  error: {
    bg: "rgba(255,87,87,0.08)",
    border: "rgba(255,87,87,0.25)",
    icon: "#FF5757",
  },
  warning: {
    bg: "rgba(255,212,87,0.08)",
    border: "rgba(255,212,87,0.25)",
    icon: "#FFD457",
  },
  info: {
    bg: "rgba(54,177,255,0.08)",
    border: "rgba(54,177,255,0.25)",
    icon: "#36B1FF",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = COLORS[toast.type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl w-80 relative animate-slide-in"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: colors.border, color: colors.icon }}
      >
        {ICONS[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] leading-snug break-words">
          {toast.message}
        </p>
        {toast.txHash && (
          <a
            href={`${EXPLORER_BASE}/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mt-1 inline-block hover:underline"
            style={{ color: colors.icon }}
          >
            View on Explorer →
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
