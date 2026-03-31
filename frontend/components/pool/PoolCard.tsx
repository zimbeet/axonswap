"use client";

import Link from "next/link";
import { Pool } from "@/hooks/usePoolList";

interface PoolCardProps {
  pool: Pool;
  rank: number;
}

export function PoolCard({ pool, rank }: PoolCardProps) {
  return (
    <Link
      href={`/add?token0=${pool.token0Symbol}&token1=${pool.token1Symbol}&fee=${pool.fee}`}
      className="flex items-center gap-3 py-4 px-2 rounded-xl transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
      style={{ borderTop: "1px solid var(--border-default)" }}
    >
      {/* Rank */}
      <span className="text-xs text-[var(--text-tertiary)] w-5 flex-shrink-0 text-center">
        {rank}
      </span>

      {/* Token icons + pair */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex -space-x-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]"
            style={{ background: pool.token0Color }}
          >
            {pool.token0Symbol[0]}
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-card)]"
            style={{ background: pool.token1Color }}
          >
            {pool.token1Symbol[0]}
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate block">
            {pool.token0Symbol} / {pool.token1Symbol}
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs flex-shrink-0"
          style={{
            background: "rgba(54,177,255,0.1)",
            color: "var(--accent-blue)",
          }}
        >
          {pool.feeTier}
        </span>
      </div>

      {/* TVL */}
      <span className="text-sm text-[var(--text-primary)] w-20 text-right flex-shrink-0">
        {pool.tvl === "—" ? (
          <span className="text-[var(--text-tertiary)]">—</span>
        ) : (
          pool.tvl
        )}
      </span>

      {/* Volume */}
      <span className="text-sm text-[var(--text-secondary)] w-20 text-right flex-shrink-0 hidden sm:block">
        {pool.volume24h === "—" ? (
          <span className="text-[var(--text-tertiary)]">—</span>
        ) : (
          pool.volume24h
        )}
      </span>

      {/* APR */}
      <span
        className="text-sm w-16 text-right flex-shrink-0 hidden md:block"
        style={{ color: "var(--accent-green)" }}
      >
        {pool.apr === "—" ? (
          <span className="text-[var(--text-tertiary)]">—</span>
        ) : (
          pool.apr
        )}
      </span>
    </Link>
  );
}
