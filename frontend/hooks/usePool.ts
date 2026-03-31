"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { Token } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, FACTORY_ABI, POOL_ABI } from "@/lib/contracts";
import { sqrtPriceX96ToPrice } from "@/lib/prices";

export interface PoolData {
  /** The on-chain pool address returned by the factory (zero address = not deployed) */
  poolAddress: `0x${string}` | null;
  /** Current pool sqrt price (Q64.96) */
  sqrtPriceX96: bigint | null;
  /** Current pool tick */
  tick: number | null;
  /** Total in-range liquidity */
  liquidity: bigint | null;
  /** Human-readable current price of token0 denominated in token1 */
  currentPrice: number | null;
  /** True while any read is loading */
  isLoading: boolean;
  /** Any error from the contract reads */
  error: Error | null;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Fetches pool data for a given token pair + fee tier.
 * Uses Factory.getPool() to find the pool address, then reads slot0 and liquidity.
 *
 * Gracefully returns null data when:
 * - tokens are not selected
 * - contracts are not deployed (empty address)
 * - the pool has not been created yet (zero address returned from factory)
 */
export function usePool(
  token0: Token | null,
  token1: Token | null,
  fee: number
): PoolData {
  const factoryAddress = CONTRACT_ADDRESSES.FACTORY;
  const hasContracts = !!factoryAddress;
  const hasTokens = !!token0 && !!token1;

  // Use token addresses — if either token is the native token (empty address)
  // we use WAXON instead (native AXON is always handled as WAXON in the pool).
  const waxonAddress = CONTRACT_ADDRESSES.WAXON;
  const addr0 = token0?.address
    ? (token0.address as `0x${string}`)
    : waxonAddress;
  const addr1 = token1?.address
    ? (token1.address as `0x${string}`)
    : waxonAddress;

  // Step 1: get pool address from factory
  const {
    data: factoryData,
    isLoading: factoryLoading,
    error: factoryError,
  } = useReadContracts({
    contracts: [
      {
        address: factoryAddress || undefined,
        abi: FACTORY_ABI,
        functionName: "getPool",
        args: [addr0, addr1, fee],
      },
    ],
    query: {
      enabled: hasContracts && hasTokens,
    },
  });

  const poolAddress = useMemo((): `0x${string}` | null => {
    const result = factoryData?.[0];
    if (result?.status !== "success") return null;
    const addr = result.result as `0x${string}`;
    if (addr === ZERO_ADDRESS) return null;
    return addr;
  }, [factoryData]);

  // Step 2: read slot0 + liquidity from the pool contract
  const {
    data: poolData,
    isLoading: poolLoading,
    error: poolError,
  } = useReadContracts({
    contracts: [
      {
        address: poolAddress ?? undefined,
        abi: POOL_ABI,
        functionName: "slot0",
      },
      {
        address: poolAddress ?? undefined,
        abi: POOL_ABI,
        functionName: "liquidity",
      },
    ],
    query: {
      enabled: !!poolAddress,
    },
  });

  const result = useMemo((): PoolData => {
    if (!poolAddress) {
      return {
        poolAddress: null,
        sqrtPriceX96: null,
        tick: null,
        liquidity: null,
        currentPrice: null,
        isLoading: factoryLoading,
        error: factoryError as Error | null,
      };
    }

    const slot0Result = poolData?.[0];
    const liquidityResult = poolData?.[1];

    const slot0 =
      slot0Result?.status === "success"
        ? (slot0Result.result as readonly [bigint, number, number, number, number, number, boolean])
        : null;

    const liquidity =
      liquidityResult?.status === "success"
        ? (liquidityResult.result as bigint)
        : null;

    const sqrtPriceX96 = slot0 ? slot0[0] : null;
    const tick = slot0 ? slot0[1] : null;

    const currentPrice =
      sqrtPriceX96 !== null && token0 && token1
        ? sqrtPriceX96ToPrice(sqrtPriceX96, token0.decimals, token1.decimals)
        : null;

    return {
      poolAddress,
      sqrtPriceX96,
      tick,
      liquidity,
      currentPrice,
      isLoading: factoryLoading || poolLoading,
      error: (factoryError ?? poolError ?? null) as Error | null,
    };
  }, [
    poolAddress,
    poolData,
    factoryLoading,
    poolLoading,
    factoryError,
    poolError,
    token0,
    token1,
  ]);

  return result;
}
