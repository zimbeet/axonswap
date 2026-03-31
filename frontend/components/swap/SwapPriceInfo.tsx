"use client";

import { Token } from "@/lib/tokens";
import { priceImpactColor } from "@/lib/utils";
import { parseUnits, formatUnits } from "viem";

interface SwapPriceInfoProps {
  fromToken: Token | null;
  toToken: Token | null;
  toAmount: string;
  executionPrice: string | null;
  priceImpact: number | null;
  slippage: number;
  feeTier: number | null;
  isQuoting: boolean;
}

function fmtFee(fee: number | null): string {
  if (fee === null) return "—";
  if (fee === 500) return "0.05%";
  if (fee === 3000) return "0.3%";
  if (fee === 10000) return "1%";
  return `${fee / 10000}%`;
}

export function SwapPriceInfo({
  fromToken,
  toToken,
  toAmount,
  executionPrice,
  priceImpact,
  slippage,
  feeTier,
  isQuoting,
}: SwapPriceInfoProps) {
  const minReceived =
    toToken && toAmount
      ? (() => {
          try {
            const raw = parseUnits(toAmount, toToken.decimals);
            const min =
              (raw * BigInt(Math.floor((1 - slippage / 100) * 1_000_000))) /
              1_000_000n;
            const num =
              Number(formatUnits(min, toToken.decimals));
            return num.toFixed(toToken.decimals <= 6 ? 4 : 6);
          } catch {
            return "—";
          }
        })()
      : "—";

  if (isQuoting) {
    return (
      <div
        className="rounded-xl px-4 py-3 space-y-2"
        style={{
          background: "rgba(54,177,255,0.04)",
          border: "1px solid rgba(54,177,255,0.08)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div
              className="h-3 rounded animate-pulse"
              style={{ width: "30%", background: "var(--bg-input)" }}
            />
            <div
              className="h-3 rounded animate-pulse"
              style={{ width: "40%", background: "var(--bg-input)" }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm space-y-1.5"
      style={{
        background: "rgba(54,177,255,0.04)",
        border: "1px solid rgba(54,177,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-secondary)]">Price</span>
        <span className="text-[var(--text-primary)] font-mono">
          {executionPrice && fromToken && toToken
            ? `1 ${fromToken.symbol} = ${executionPrice} ${toToken.symbol}`
            : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-secondary)]">Price Impact</span>
        <span className={`font-mono ${priceImpactColor(priceImpact)}`}>
          {priceImpact !== null ? `${priceImpact.toFixed(2)}%` : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-secondary)]">Min. Received</span>
        <span className="text-[var(--text-primary)] font-mono">
          {minReceived !== "—" ? `${minReceived} ${toToken?.symbol ?? ""}` : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-secondary)]">Slippage Tolerance</span>
        <span className="text-[var(--text-primary)]">{slippage}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-secondary)]">Route</span>
        <span className="text-[var(--text-primary)]">
          {fromToken && toToken
            ? `${fromToken.symbol} → ${toToken.symbol} (${fmtFee(feeTier)})`
            : "—"}
        </span>
      </div>
    </div>
  );
}
