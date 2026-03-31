"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PercentageSlider } from "@/components/liquidity/PercentageSlider";

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RemoveLiquidityPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [percentage, setPercentage] = useState(100);

  // Mock position data — would come from the position ID in URL params
  const mockPosition = {
    token0Symbol: "AXON",
    token1Symbol: "USDC",
    feeTier: "0.30%",
    token0Amount: "0.00",
    token1Amount: "0.00",
    fees0: "0.00",
    fees1: "0.00",
    token0Color: "#36B1FF",
    token1Color: "#2775CA",
  };

  const ratio = percentage / 100;
  const receive0 = (Number(mockPosition.token0Amount) * ratio).toFixed(6);
  const receive1 = (Number(mockPosition.token1Amount) * ratio).toFixed(6);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/pool" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6">
        <BackIcon />
        Back to Pools
      </Link>

      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Remove Liquidity</h1>

      <div className="space-y-4">
        {/* Position info */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]" style={{ background: mockPosition.token0Color }}>
                {mockPosition.token0Symbol[0]}
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]" style={{ background: mockPosition.token1Color }}>
                {mockPosition.token1Symbol[0]}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {mockPosition.token0Symbol} / {mockPosition.token1Symbol}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{mockPosition.feeTier} fee tier</p>
            </div>
          </div>

          {/* Percentage slider */}
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Amount to remove
          </p>
          <PercentageSlider value={percentage} onChange={setPercentage} />
        </Card>

        {/* You will receive */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            You will receive
          </p>
          <div className="space-y-3">
            {[
              { symbol: mockPosition.token0Symbol, amount: receive0, color: mockPosition.token0Color },
              { symbol: mockPosition.token1Symbol, amount: receive1, color: mockPosition.token1Color },
            ].map(({ symbol, amount, color }) => (
              <div key={symbol} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
                    {symbol[0]}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{symbol}</span>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{amount}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Uncollected fees */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Uncollected Fees (also collected)
          </p>
          <div className="space-y-2">
            {[
              { symbol: mockPosition.token0Symbol, amount: mockPosition.fees0, color: mockPosition.token0Color },
              { symbol: mockPosition.token1Symbol, amount: mockPosition.fees1, color: mockPosition.token1Color },
            ].map(({ symbol, amount, color }) => (
              <div key={symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
                    {symbol[0]}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{symbol}</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{amount}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        {!isConnected ? (
          <Button variant="primary" className="w-full" size="lg" onClick={openConnectModal}>Connect Wallet</Button>
        ) : (
          <Button variant="primary" className="w-full" size="lg" disabled>
            Contracts not deployed yet
          </Button>
        )}
      </div>
    </div>
  );
}
