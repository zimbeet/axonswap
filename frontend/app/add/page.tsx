"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TokenSelectorModal } from "@/components/swap/TokenSelectorModal";
import { FeeSelector } from "@/components/liquidity/FeeSelector";
import { PriceRangeInput } from "@/components/liquidity/PriceRangeInput";
import { LiquidityPreview } from "@/components/liquidity/LiquidityPreview";
import { Token, AXON_CHAIN_ID, DEFAULT_TOKEN_LIST } from "@/lib/tokens";
import { usePriceRange } from "@/hooks/usePriceRange";

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TOKEN_COLORS: Record<string, string> = {
  AXON: "#36B1FF", WAXON: "#6A75FF", USDC: "#2775CA",
  USDT: "#26A17B", WBTC: "#F7931A", WETH: "#627EEA",
};

function getColor(symbol: string) { return TOKEN_COLORS[symbol] ?? "#4A4F5C"; }

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(54,177,255,0.15)", color: "var(--accent-blue)" }}>{n}</span>
      {label}
    </p>
  );
}

export default function AddLiquidityPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [token0, setToken0] = useState<Token | null>(DEFAULT_TOKEN_LIST[0] ?? null);
  const [token1, setToken1] = useState<Token | null>(DEFAULT_TOKEN_LIST[2] ?? null);
  const [fee, setFee] = useState(3000);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0SelectorOpen, setToken0SelectorOpen] = useState(false);
  const [token1SelectorOpen, setToken1SelectorOpen] = useState(false);

  const priceRange = usePriceRange(token0, token1);

  const canPreview =
    token0 && token1 &&
    (amount0 || amount1) &&
    (priceRange.isFullRange || priceRange.isValidRange);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/pool" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6">
        <BackIcon />
        Back to Pools
      </Link>

      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Add Liquidity</h1>

      <div className="space-y-4">
        {/* Step 1: Select Pair */}
        <Card className="p-5">
          <StepLabel n={1} label="Select Token Pair" />
          <div className="flex gap-3">
            {[
              { token: token0, open: () => setToken0SelectorOpen(true) },
              { token: token1, open: () => setToken1SelectorOpen(true) },
            ].map(({ token, open }, idx) => (
              <button
                key={idx}
                onClick={open}
                className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:border-[var(--border-hover)]"
                style={{
                  background: token ? "rgba(54,177,255,0.08)" : "var(--bg-input)",
                  color: token ? "var(--accent-blue)" : "var(--text-secondary)",
                  border: `1px solid ${token ? "rgba(54,177,255,0.2)" : "var(--border-default)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {token && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getColor(token.symbol) }}>
                      {token.symbol[0]}
                    </div>
                  )}
                  <span>{token ? token.symbol : "Select token"}</span>
                </div>
                <ChevronDown />
              </button>
            ))}
          </div>
        </Card>

        {/* Step 2: Fee Tier */}
        <Card className="p-5">
          <StepLabel n={2} label="Fee Tier" />
          <FeeSelector selected={fee} onChange={setFee} />
        </Card>

        {/* Step 3: Price Range */}
        <Card className="p-5">
          <StepLabel n={3} label="Set Price Range" />
          <PriceRangeInput
            minPrice={priceRange.minPrice}
            maxPrice={priceRange.maxPrice}
            isFullRange={priceRange.isFullRange}
            priceLabel={priceRange.priceLabel}
            onMinChange={priceRange.setMinPrice}
            onMaxChange={priceRange.setMaxPrice}
            onFullRangeToggle={priceRange.setFullRange}
          />
        </Card>

        {/* Step 4: Deposit Amounts */}
        <Card className="p-5">
          <StepLabel n={4} label="Deposit Amounts" />
          <div className="space-y-3">
            {[
              { token: token0, value: amount0, setter: setAmount0, colorKey: "blue" },
              { token: token1, value: amount1, setter: setAmount1, colorKey: "violet" },
            ].map(({ token, value, setter, colorKey }) => (
              <div key={colorKey} className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)" }}>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="flex-1 bg-transparent text-xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {token ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: colorKey === "blue" ? "rgba(54,177,255,0.1)" : "rgba(106,117,255,0.1)", color: colorKey === "blue" ? "var(--accent-blue)" : "var(--accent-violet)" }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getColor(token.symbol) }}>{token.symbol[0]}</div>
                      <span className="text-sm font-semibold">{token.symbol}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--text-tertiary)]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Step 5: Preview */}
        {canPreview && (
          <LiquidityPreview
            token0={token0}
            token1={token1}
            fee={fee}
            amount0={amount0}
            amount1={amount1}
            minPrice={priceRange.minPrice}
            maxPrice={priceRange.maxPrice}
            isFullRange={priceRange.isFullRange}
          />
        )}

        {/* CTA */}
        {!isConnected ? (
          <Button variant="primary" className="w-full" size="lg" onClick={openConnectModal}>
            Connect Wallet
          </Button>
        ) : !token0 || !token1 ? (
          <Button variant="primary" className="w-full" size="lg" disabled>Select both tokens</Button>
        ) : !priceRange.isFullRange && !priceRange.isValidRange ? (
          <Button variant="primary" className="w-full" size="lg" disabled>Set a valid price range</Button>
        ) : !amount0 && !amount1 ? (
          <Button variant="primary" className="w-full" size="lg" disabled>Enter deposit amounts</Button>
        ) : (
          <Button variant="primary" className="w-full" size="lg" disabled>
            Contracts not deployed yet
          </Button>
        )}
      </div>

      {/* Token selectors */}
      <TokenSelectorModal
        isOpen={token0SelectorOpen}
        onClose={() => setToken0SelectorOpen(false)}
        onSelect={(t: Token) => { setToken0(t); setToken0SelectorOpen(false); }}
        selectedToken={token0}
        disabledToken={token1}
        chainId={AXON_CHAIN_ID}
      />
      <TokenSelectorModal
        isOpen={token1SelectorOpen}
        onClose={() => setToken1SelectorOpen(false)}
        onSelect={(t: Token) => { setToken1(t); setToken1SelectorOpen(false); }}
        selectedToken={token1}
        disabledToken={token0}
        chainId={AXON_CHAIN_ID}
      />
    </div>
  );
}
