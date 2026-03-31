"use client";

import { useState, useCallback } from "react";
import { Token } from "@/lib/tokens";
import { useDebounce } from "./useDebounce";

export interface PriceRange {
  minPrice: string;
  maxPrice: string;
  isFullRange: boolean;
}

export function usePriceRange(token0: Token | null, token1: Token | null) {
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

  return {
    minPrice,
    maxPrice,
    isFullRange,
    isValidRange,
    priceLabel,
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
