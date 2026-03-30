"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const FEE_TIERS = [
  { value: "500", label: "0.05%", description: "Best for stable pairs" },
  { value: "3000", label: "0.3%", description: "Best for most pairs" },
  { value: "10000", label: "1%", description: "Best for exotic pairs" },
];

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 12H5M5 12l7 7M5 12l7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddLiquidityPage() {
  const [selectedFee, setSelectedFee] = useState("3000");
  const [token0] = useState("AXON");
  const [token1] = useState("USDT");

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Back */}
      <Link
        href="/pool"
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <BackIcon />
        Back to Pools
      </Link>

      <Card className="p-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">
          Add Liquidity
        </h1>

        {/* Step 1: Select pair */}
        <div className="mb-6">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Step 1 — Select Token Pair
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              {token0}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              {token1}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step 2: Fee Tier */}
        <div className="mb-6">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Step 2 — Fee Tier
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FEE_TIERS.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setSelectedFee(tier.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background:
                    selectedFee === tier.value
                      ? "rgba(54,177,255,0.1)"
                      : "var(--bg-input)",
                  border:
                    selectedFee === tier.value
                      ? "1px solid rgba(54,177,255,0.4)"
                      : "1px solid var(--border-default)",
                  color:
                    selectedFee === tier.value
                      ? "var(--accent-blue)"
                      : "var(--text-primary)",
                }}
              >
                <div className="font-semibold text-sm">{tier.label}</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {tier.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Price Range */}
        <div className="mb-6">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Step 3 — Set Price Range
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Min Price
              </p>
              <input
                type="number"
                placeholder="0.0"
                className="w-full bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {token1} per {token0}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Max Price
              </p>
              <input
                type="number"
                placeholder="∞"
                className="w-full bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {token1} per {token0}
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Deposit Amounts */}
        <div className="mb-6">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Step 4 — Deposit Amounts
          </p>
          <div className="space-y-3">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: "rgba(54,177,255,0.1)",
                    color: "var(--accent-blue)",
                  }}
                >
                  {token0}
                </span>
              </div>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: "rgba(106,117,255,0.1)",
                    color: "var(--accent-violet)",
                  }}
                >
                  {token1}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button variant="primary" className="w-full" size="lg">
          Connect Wallet to Add Liquidity
        </Button>
      </Card>
    </div>
  );
}
