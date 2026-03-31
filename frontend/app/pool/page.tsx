"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PoolCard } from "@/components/pool/PoolCard";
import { PositionCard } from "@/components/pool/PositionCard";
import { PoolCardSkeleton } from "@/components/ui/Skeleton";
import { usePoolList, SortField } from "@/hooks/usePoolList";
import { usePositions } from "@/hooks/usePositions";

type Tab = "all" | "positions" | "top";

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function PoolPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("tvl");

  const { pools, isLoading: poolsLoading } = usePoolList(search, sortBy);
  const { positions, isLoading: positionsLoading } = usePositions();

  const TABS: { id: Tab; label: string }[] = [
    { id: "all", label: "All Pools" },
    { id: "positions", label: "My Positions" },
    { id: "top", label: "Top Pools" },
  ];

  const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: "tvl", label: "TVL" },
    { field: "volume", label: "Volume" },
    { field: "apr", label: "APR" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pools</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Provide liquidity and earn fees</p>
        </div>
        <Link href="/add">
          <Button variant="primary" size="md">+ New Position</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--bg-input)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "var(--bg-card)" : "transparent",
              color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {tab.label}
            {tab.id === "positions" && isConnected && positions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--accent-blue)", color: "white" }}>
                {positions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Positions Tab */}
      {activeTab === "positions" && (
        <div>
          {!isConnected ? (
            <Card className="p-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-input)" }}>🔗</div>
              <p className="text-[var(--text-secondary)] text-sm">Connect your wallet to view positions</p>
              <Button variant="primary" size="md" onClick={openConnectModal}>Connect Wallet</Button>
            </Card>
          ) : positionsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-input)" }} />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <Card className="p-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-input)" }}>💧</div>
              <p className="text-[var(--text-secondary)] text-sm">No active positions</p>
              <Link href="/add"><Button variant="secondary" size="sm">Add Liquidity</Button></Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {positions.map((pos) => <PositionCard key={pos.tokenId} position={pos} />)}
            </div>
          )}
        </div>
      )}

      {/* All Pools / Top Pools Tab */}
      {(activeTab === "all" || activeTab === "top") && (
        <Card className="p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)" }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by token symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-lg leading-none">×</button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-tertiary)] mr-1">Sort:</span>
              {SORT_OPTIONS.map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => setSortBy(field)}
                  className="text-xs font-medium transition-colors px-2 py-1 rounded-md"
                  style={{
                    color: sortBy === field ? "var(--accent-blue)" : "var(--text-tertiary)",
                    background: sortBy === field ? "rgba(54,177,255,0.1)" : "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid px-5 py-3 text-xs font-medium text-[var(--text-secondary)]"
            style={{ gridTemplateColumns: "2rem 1fr 5rem 5rem 4.5rem", borderBottom: "1px solid var(--border-default)" }}>
            <span>#</span>
            <span>Pool</span>
            <span className="text-right">TVL</span>
            <span className="text-right">24h Volume</span>
            <span className="text-right">APR</span>
          </div>

          {/* Rows */}
          <div className="px-3 pb-3">
            {poolsLoading ? (
              [1, 2, 3].map((i) => <PoolCardSkeleton key={i} />)
            ) : pools.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-[var(--text-secondary)]">No pools found. Create the first pool!</p>
                <Link href="/add"><Button variant="secondary" size="sm">Create Pool</Button></Link>
              </div>
            ) : (
              pools.map((pool, i) => <PoolCard key={pool.id} pool={pool} rank={i + 1} />)
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
