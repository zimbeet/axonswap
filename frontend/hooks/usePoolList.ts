"use client";

import { useMemo } from "react";

export interface Pool {
  id: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  feeTier: string;
  tvl: string;
  volume24h: string;
  apr: string;
  token0Color: string;
  token1Color: string;
}

const TOKEN_COLORS: Record<string, string> = {
  AXON: "#36B1FF",
  WAXON: "#6A75FF",
  USDC: "#2775CA",
  USDT: "#26A17B",
  WBTC: "#F7931A",
  WETH: "#627EEA",
};

export function getTokenColor(symbol: string): string {
  return TOKEN_COLORS[symbol] ?? "#4A4F5C";
}

const MOCK_POOLS: Pool[] = [
  {
    id: "axon-usdc-500",
    token0Symbol: "AXON",
    token1Symbol: "USDC",
    fee: 500,
    feeTier: "0.05%",
    tvl: "—",
    volume24h: "—",
    apr: "—",
    token0Color: getTokenColor("AXON"),
    token1Color: getTokenColor("USDC"),
  },
  {
    id: "axon-usdt-3000",
    token0Symbol: "AXON",
    token1Symbol: "USDT",
    fee: 3000,
    feeTier: "0.30%",
    tvl: "—",
    volume24h: "—",
    apr: "—",
    token0Color: getTokenColor("AXON"),
    token1Color: getTokenColor("USDT"),
  },
  {
    id: "waxon-usdc-3000",
    token0Symbol: "WAXON",
    token1Symbol: "USDC",
    fee: 3000,
    feeTier: "0.30%",
    tvl: "—",
    volume24h: "—",
    apr: "—",
    token0Color: getTokenColor("WAXON"),
    token1Color: getTokenColor("USDC"),
  },
  {
    id: "axon-weth-3000",
    token0Symbol: "AXON",
    token1Symbol: "WETH",
    fee: 3000,
    feeTier: "0.30%",
    tvl: "—",
    volume24h: "—",
    apr: "—",
    token0Color: getTokenColor("AXON"),
    token1Color: getTokenColor("WETH"),
  },
  {
    id: "usdc-usdt-500",
    token0Symbol: "USDC",
    token1Symbol: "USDT",
    fee: 500,
    feeTier: "0.05%",
    tvl: "—",
    volume24h: "—",
    apr: "—",
    token0Color: getTokenColor("USDC"),
    token1Color: getTokenColor("USDT"),
  },
];

export type SortField = "tvl" | "volume" | "apr";

export function usePoolList(search: string, sortBy: SortField) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const pools = q
      ? MOCK_POOLS.filter(
          (p) =>
            p.token0Symbol.toLowerCase().includes(q) ||
            p.token1Symbol.toLowerCase().includes(q)
        )
      : MOCK_POOLS;
    // All values are "—" for now, so sorting order stays the same
    return pools;
  }, [search, sortBy]);

  return { pools: filtered, isLoading: false };
}
