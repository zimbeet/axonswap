"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function ArrowDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M3 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken] = useState("AXON");
  const [toToken] = useState("USDT");
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)] px-4 py-12">
      <div className="w-full max-w-[480px]">
        <Card className="p-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
              Swap
            </h2>
            <button
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {/* From Token */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-input)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Sell
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Balance: — <button className="text-[var(--accent-blue)] hover:underline ml-1">MAX</button>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm"
                  style={{
                    background: "rgba(54,177,255,0.1)",
                    color: "var(--accent-blue)",
                    border: "1px solid rgba(54,177,255,0.2)",
                  }}
                >
                  <span>{fromToken}</span>
                  <ChevronDownIcon />
                </button>
              </div>
            </div>

            {/* Swap direction button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                onClick={handleFlip}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: "var(--bg-card)",
                  border: "4px solid var(--bg-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowDownIcon />
              </button>
            </div>

            {/* To Token */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-input)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Buy
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Balance: —
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-transparent text-2xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm"
                  style={{
                    background: "rgba(54,177,255,0.1)",
                    color: "var(--accent-blue)",
                    border: "1px solid rgba(54,177,255,0.2)",
                  }}
                >
                  <span>{toToken}</span>
                  <ChevronDownIcon />
                </button>
              </div>
            </div>

            {/* Price info */}
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(54,177,255,0.04)",
                border: "1px solid rgba(54,177,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Price</span>
                <span className="text-[var(--text-primary)]">
                  1 {fromToken} = — {toToken}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[var(--text-secondary)]">
                <span>Price Impact</span>
                <span className="text-[var(--accent-green)]">—</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[var(--text-secondary)]">
                <span>Slippage Tolerance</span>
                <span>0.5%</span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="pt-1">
              <Button variant="primary" className="w-full" size="lg">
                Connect Wallet to Swap
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
