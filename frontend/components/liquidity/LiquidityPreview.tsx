"use client";

import { Token } from "@/lib/tokens";

interface LiquidityPreviewProps {
  token0: Token | null;
  token1: Token | null;
  fee: number;
  amount0: string;
  amount1: string;
  minPrice: string;
  maxPrice: string;
  isFullRange: boolean;
}

const FEE_LABELS: Record<number, string> = {
  500: "0.05%",
  3000: "0.30%",
  10000: "1.00%",
};

export function LiquidityPreview({
  token0,
  token1,
  fee,
  amount0,
  amount1,
  minPrice,
  maxPrice,
  isFullRange,
}: LiquidityPreviewProps) {
  if (!token0 || !token1) return null;

  const rows = [
    { label: "Token pair", value: `${token0.symbol} / ${token1.symbol}` },
    { label: "Fee tier", value: FEE_LABELS[fee] ?? `${fee}` },
    {
      label: `${token0.symbol} deposit`,
      value: amount0 ? `${Number(amount0).toFixed(6)} ${token0.symbol}` : "—",
    },
    {
      label: `${token1.symbol} deposit`,
      value: amount1 ? `${Number(amount1).toFixed(6)} ${token1.symbol}` : "—",
    },
    {
      label: "Price range",
      value: isFullRange
        ? "Full range"
        : minPrice && maxPrice
        ? `${minPrice} — ${maxPrice === "∞" ? "∞" : maxPrice}`
        : "—",
    },
  ];

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "rgba(54,177,255,0.04)",
        border: "1px solid rgba(54,177,255,0.12)",
      }}
    >
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Preview
      </p>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">{label}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
