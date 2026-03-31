"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const MOCK_POOLS = [
  {
    pair: "AXON / USDT",
    fee: "0.3%",
    tvl: "$—",
    volume24h: "$—",
    apr: "—%",
  },
  {
    pair: "AXON / USDC",
    fee: "0.3%",
    tvl: "$—",
    volume24h: "$—",
    apr: "—%",
  },
  {
    pair: "WAXON / USDT",
    fee: "0.05%",
    tvl: "$—",
    volume24h: "$—",
    apr: "—%",
  },
];

export default function PoolPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Pools
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Provide liquidity and earn fees
          </p>
        </div>
        <Link href="/add">
          <Button variant="primary">+ New Position</Button>
        </Link>
      </div>

      {/* My Positions */}
      <Card className="p-6 mb-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          My Positions
        </h2>
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "var(--bg-input)" }}
          >
            💧
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            No active positions
          </p>
          <Link href="/add">
            <Button variant="secondary" size="sm">
              Add Liquidity
            </Button>
          </Link>
        </div>
      </Card>

      {/* All Pools */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          All Pools
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--text-secondary)]">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Pool</th>
                <th className="pb-3 font-medium text-right">TVL</th>
                <th className="pb-3 font-medium text-right">24h Volume</th>
                <th className="pb-3 font-medium text-right">APR</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POOLS.map((pool, i) => (
                <tr
                  key={i}
                  className="border-t text-sm hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <td className="py-4 text-[var(--text-tertiary)]">{i + 1}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]">A</div>
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-violet)] flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]">U</div>
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">
                        {pool.pair}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: "rgba(54,177,255,0.1)",
                          color: "var(--accent-blue)",
                        }}
                      >
                        {pool.fee}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-[var(--text-primary)]">
                    {pool.tvl}
                  </td>
                  <td className="py-4 text-right text-[var(--text-secondary)]">
                    {pool.volume24h}
                  </td>
                  <td className="py-4 text-right text-[var(--accent-green)]">
                    {pool.apr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
