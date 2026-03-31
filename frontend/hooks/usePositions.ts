"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

export interface Position {
  tokenId: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  feeTier: string;
  liquidity: string;
  minPrice: string;
  maxPrice: string;
  currentPrice: string;
  inRange: boolean;
  uncollectedFees0: string;
  uncollectedFees1: string;
  token0Color: string;
  token1Color: string;
}

const MOCK_POSITIONS: Position[] = [];

export function usePositions() {
  const { isConnected } = useAccount();

  const positions = useMemo(() => {
    if (!isConnected) return [];
    return MOCK_POSITIONS;
  }, [isConnected]);

  return { positions, isLoading: false };
}
