"use client";

import { useState, useCallback, useMemo } from "react";
import { Token } from "@/lib/tokens";
import {
  priceToTick,
  nearestUsableTick,
  getTickSpacing,
  MIN_TICK,
  MAX_TICK,
} from "@/lib/ticks";
import { useDebounce } from "./useDebounce";

export interface PriceRange {
  minPrice: string;
  maxPrice: string;
  isFullRange: boolean;
}

/**
 * Manages the price range state for an Add Liquidity position.
 * Also exposes the computed tick values needed by NonfungiblePositionManager.mint().
 */
export function usePriceRange(
  token0: Token | null,
  token1: Token | null,
  fee = 3000
) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFullRange, setIsFullRange] = useState(false);

  const debouncedMin = useDebounce(minPrice, 300);
  const debouncedMax = useDebounce(maxPrice, 300);

  const setFullRange = useCallback((full: boolean) => {
    setIsFullRange(full);
    if (full) {
      setMinPrice("0");
      setMaxPrice("∞");
    } else {
      setMinPrice("");
      setMaxPrice("");
    }
  }, []);

  const isValidRange =
    isFullRange ||
    (debouncedMin !== "" &&
      debouncedMax !== "" &&
      debouncedMax !== "∞" &&
      Number(debouncedMin) < Number(debouncedMax) &&
      Number(debouncedMin) >= 0);

  const priceLabel = token0 && token1 ? `${token1.symbol} per ${token0.symbol}` : "";

  /** Computed tick values for the selected price range. */
  const ticks = useMemo(() => {
    const decimals0 = token0?.decimals ?? 18;
    const decimals1 = token1?.decimals ?? 18;
    const tickSpacing = getTickSpacing(fee);

    if (isFullRange) {
      return {
        tickLower: nearestUsableTick(MIN_TICK, tickSpacing),
        tickUpper: nearestUsableTick(MAX_TICK, tickSpacing),
      };
    }

    const minNum = Number(debouncedMin);
    const maxNum = Number(debouncedMax);

    if (!isValidRange || isNaN(minNum) || isNaN(maxNum)) {
      return { tickLower: null, tickUpper: null };
    }

    const rawTickLower = priceToTick(minNum, decimals0, decimals1);
    const rawTickUpper = priceToTick(maxNum, decimals0, decimals1);

    return {
      tickLower: nearestUsableTick(rawTickLower, tickSpacing),
      tickUpper: nearestUsableTick(rawTickUpper, tickSpacing),
    };
  }, [
    isFullRange,
    isValidRange,
    debouncedMin,
    debouncedMax,
    fee,
    token0?.decimals,
    token1?.decimals,
  ]);

  return {
    minPrice,
    maxPrice,
    isFullRange,
    isValidRange,
    priceLabel,
    /** tickLower for NonfungiblePositionManager.mint() — null if range is invalid */
    tickLower: ticks.tickLower,
    /** tickUpper for NonfungiblePositionManager.mint() — null if range is invalid */
    tickUpper: ticks.tickUpper,
    setMinPrice: (v: string) => {
      setIsFullRange(false);
      setMinPrice(v);
    },
    setMaxPrice: (v: string) => {
      setIsFullRange(false);
      setMaxPrice(v);
    },
    setFullRange,
  };
}
