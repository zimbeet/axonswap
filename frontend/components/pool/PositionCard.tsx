"use client";

import Link from "next/link";
import { Position } from "@/hooks/usePositions";
import { Button } from "@/components/ui/Button";

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  return (
    <div
      className="p-4 rounded-xl transition-all hover:border-[var(--border-hover)]"
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-input)]"
              style={{ background: position.token0Color }}
            >
              {position.token0Symbol[0]}
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--bg-input)]"
              style={{ background: position.token1Color }}
            >
              {position.token1Symbol[0]}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {position.token0Symbol} / {position.token1Symbol}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {position.feeTier} fee
            </p>
          </div>
        </div>

        {/* Range badge */}
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: position.inRange
              ? "rgba(54,255,166,0.1)"
              : "rgba(255,87,87,0.1)",
            color: position.inRange ? "var(--accent-green)" : "var(--accent-red)",
            border: `1px solid ${
              position.inRange
                ? "rgba(54,255,166,0.25)"
                : "rgba(255,87,87,0.25)"
            }`,
          }}
        >
          {position.inRange ? "● In Range" : "● Out of Range"}
        </span>
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--bg-card)" }}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-0.5">
            Min Price
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {position.minPrice}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {position.token1Symbol}/{position.token0Symbol}
          </p>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--bg-card)" }}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-0.5">
            Max Price
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {position.maxPrice}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {position.token1Symbol}/{position.token0Symbol}
          </p>
        </div>
      </div>

      {/* Uncollected Fees */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{
          background: "rgba(54,177,255,0.05)",
          border: "1px solid rgba(54,177,255,0.1)",
        }}
      >
        <p className="text-xs text-[var(--text-secondary)] mb-1">
          Uncollected Fees
        </p>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-primary)]">
            {position.uncollectedFees0} {position.token0Symbol}
          </span>
          <span className="text-[var(--text-primary)]">
            {position.uncollectedFees1} {position.token1Symbol}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1">
          Collect Fees
        </Button>
        <Link href={`/remove?tokenId=${position.tokenId}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full">
            Remove
          </Button>
        </Link>
      </div>
    </div>
  );
}
