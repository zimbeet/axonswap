"use client";

import { useState, useCallback, useEffect } from "react";
import { useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Token, DEFAULT_TOKEN_LIST, isNativeToken } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, QUOTER_V2_ABI } from "@/lib/contracts";
import { useDebounce } from "./useDebounce";

const FEE_TIERS = [500, 3000, 10000] as const;
type FeeTier = (typeof FEE_TIERS)[number];

export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  deadline: number;
  isQuoting: boolean;
  quoteError: string | null;
  priceImpact: number | null;
  executionPrice: string | null;
  feeTier: number | null;
  gasEstimate: bigint | null;
  setFromToken: (token: Token | null) => void;
  setToToken: (token: Token | null) => void;
  setFromAmount: (amount: string) => void;
  setSlippage: (s: number) => void;
  setDeadline: (d: number) => void;
  flipTokens: () => void;
}

function effectiveAddress(token: Token | null): `0x${string}` | undefined {
  if (!token) return undefined;
  if (isNativeToken(token)) {
    // Use WAXON address for native AXON in contract calls
    return CONTRACT_ADDRESSES.WAXON || undefined;
  }
  return (token.address as `0x${string}`) || undefined;
}

function buildArgs(
  fromAddr: `0x${string}` | undefined,
  toAddr: `0x${string}` | undefined,
  amountIn: bigint | undefined,
  fee: FeeTier
) {
  if (!fromAddr || !toAddr || !amountIn) return undefined;
  return [
    {
      tokenIn: fromAddr,
      tokenOut: toAddr,
      amountIn,
      fee,
      sqrtPriceLimitX96: BigInt(0),
    },
  ] as const;
}

/** Try all three fee tiers simultaneously; pick the first that returns a valid result */
export function useSwap(): SwapState {
  const [fromToken, setFromToken] = useState<Token | null>(
    DEFAULT_TOKEN_LIST[0] ?? null
  );
  const [toToken, setToToken] = useState<Token | null>(
    DEFAULT_TOKEN_LIST[2] ?? null
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [executionPrice, setExecutionPrice] = useState<string | null>(null);
  const [feeTier, setFeeTier] = useState<number | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);

  const debouncedAmount = useDebounce(fromAmount, 300);

  const fromAddr = effectiveAddress(fromToken);
  const toAddr = effectiveAddress(toToken);

  const contractsDeployed = !!CONTRACT_ADDRESSES.QUOTER_V2;
  const quoteEnabled =
    contractsDeployed &&
    !!fromAddr &&
    !!toAddr &&
    fromAddr !== toAddr &&
    !!debouncedAmount &&
    Number(debouncedAmount) > 0;

  const amountInParsed: bigint | undefined = quoteEnabled
    ? (() => {
        try {
          return parseUnits(debouncedAmount, fromToken!.decimals);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  // Query all three fee tiers simultaneously — no state-driven retry needed
  const args500 = buildArgs(fromAddr, toAddr, amountInParsed, 500);
  const args3000 = buildArgs(fromAddr, toAddr, amountInParsed, 3000);
  const args10000 = buildArgs(fromAddr, toAddr, amountInParsed, 10000);

  const { data: quote500, isLoading: loading500, error: err500 } = useReadContract({
    address: CONTRACT_ADDRESSES.QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: args500,
    query: { enabled: quoteEnabled && !!args500, retry: false },
  });

  const { data: quote3000, isLoading: loading3000, error: err3000 } = useReadContract({
    address: CONTRACT_ADDRESSES.QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: args3000,
    query: { enabled: quoteEnabled && !!args3000 && !!err500, retry: false },
  });

  const { data: quote10000, isLoading: loading10000, error: err10000 } = useReadContract({
    address: CONTRACT_ADDRESSES.QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: args10000,
    query: {
      enabled: quoteEnabled && !!args10000 && !!err500 && !!err3000,
      retry: false,
    },
  });

  const isQuoting =
    quoteEnabled &&
    (loading500 ||
      (!!err500 && loading3000) ||
      (!!err500 && !!err3000 && loading10000));

  // Determine best quote
  const bestQuote: { data: unknown; tier: FeeTier } | null = quote500
    ? { data: quote500, tier: 500 }
    : quote3000
    ? { data: quote3000, tier: 3000 }
    : quote10000
    ? { data: quote10000, tier: 10000 }
    : null;

  const noLiquidity =
    quoteEnabled &&
    !isQuoting &&
    !bestQuote &&
    !!err500 &&
    !!err3000 &&
    !!err10000;

  const quoteError: string | null = !contractsDeployed
    ? "Contracts not deployed"
    : noLiquidity
    ? "Insufficient liquidity"
    : null;

  // Derive output amount and price info
  useEffect(() => {
    if (!bestQuote || !toToken || !fromToken || !debouncedAmount) {
      setToAmount("");
      setPriceImpact(null);
      setExecutionPrice(null);
      setFeeTier(null);
      setGasEstimate(null);
      return;
    }
    const [amountOut, , , gas] = bestQuote.data as [bigint, bigint, number, bigint];
    const outFormatted = formatUnits(amountOut, toToken.decimals);
    setToAmount(outFormatted);
    setGasEstimate(gas);
    setFeeTier(bestQuote.tier);

    const inNum = Number(debouncedAmount);
    const outNum = Number(outFormatted);
    if (inNum > 0 && outNum > 0) {
      setExecutionPrice((outNum / inNum).toFixed(6));
    }
    // Price impact requires spot price data (not available from quoter alone)
    setPriceImpact(null);
  }, [bestQuote, toToken, fromToken, debouncedAmount]);

  // Reset when tokens change or amount is cleared
  useEffect(() => {
    setToAmount("");
    setPriceImpact(null);
    setExecutionPrice(null);
    setFeeTier(null);
    setGasEstimate(null);
  }, [fromToken, toToken]);

  useEffect(() => {
    if (!fromAmount) {
      setToAmount("");
      setPriceImpact(null);
      setExecutionPrice(null);
      setFeeTier(null);
      setGasEstimate(null);
    }
  }, [fromAmount]);

  const flipTokens = useCallback(() => {
    setFromToken((prev) => toToken);
    setToToken((prev) => fromToken);
    setFromAmount("");
    setToAmount("");
    setPriceImpact(null);
    setExecutionPrice(null);
    setFeeTier(null);
    setGasEstimate(null);
  }, [fromToken, toToken]);

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    deadline,
    isQuoting,
    quoteError,
    priceImpact,
    executionPrice,
    feeTier,
    gasEstimate,
    setFromToken,
    setToToken,
    setFromAmount,
    setSlippage,
    setDeadline,
    flipTokens,
  };
}
