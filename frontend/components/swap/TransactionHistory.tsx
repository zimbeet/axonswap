"use client";

import { useTransactionHistory, TxRecord } from "@/hooks/useTransactionHistory";

const EXPLORER_BASE = "https://explorer.axonchain.ai";

const STATUS_CONFIG: Record<
  TxRecord["status"],
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Pending", color: "var(--accent-warning)", icon: "⏳" },
  confirmed: { label: "Confirmed", color: "var(--accent-green)", icon: "✓" },
  failed: { label: "Failed", color: "var(--accent-red)", icon: "✕" },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function TransactionHistory() {
  const { records, clear } = useTransactionHistory();

  if (records.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-2">
        <span className="text-2xl">📋</span>
        <p className="text-sm text-[var(--text-secondary)]">
          No recent transactions
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Recent Transactions
        </p>
        <button
          onClick={clear}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2">
        {records.map((tx) => {
          const cfg = STATUS_CONFIG[tx.status];
          return (
            <a
              key={tx.hash}
              href={`${EXPLORER_BASE}/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--bg-card-hover)]"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{cfg.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {shortHash(tx.hash)} · {timeAgo(tx.timestamp)}
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0 ml-2"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
