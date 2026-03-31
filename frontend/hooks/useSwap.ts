"use client";

import { useState, useCallback, useEffect } from "react";
import { useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Token, DEFAULT_TOKEN_LIST, isNativeToken, WAXON } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, QUOTER_V2_ABI } from "@/lib/contracts";
import { useDebounce } from "./useDebounce";

const FEE_TIERS = [500, 3000, 10000] as const;

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
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [executionPrice, setExecutionPrice] = useState<string | null>(null);
  const [feeTier, setFeeTier] = useState<number | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [activeFee, setActiveFee] = useState<(typeof FEE_TIERS)[number]>(500);

  const debouncedAmount = useDebounce(fromAmount, 300);

  const fromAddr = effectiveAddress(fromToken);
  const toAddr = effectiveAddress(toToken);

  const contractsDeployed =
    !!CONTRACT_ADDRESSES.QUOTER_V2 && !!fromAddr && !!toAddr;

  const amountInParsed =
    debouncedAmount && fromToken && Number(debouncedAmount) > 0
      ? (() => {
          try {
            return parseUnits(debouncedAmount, fromToken.decimals);
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const { data: quoteData, error: quoteErr } = useReadContract({
    address: CONTRACT_ADDRESSES.QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args:
      contractsDeployed && amountInParsed && fromAddr && toAddr
        ? [
            {
              tokenIn: fromAddr,
              tokenOut: toAddr,
              amountIn: amountInParsed,
              fee: activeFee,
              sqrtPriceLimitX96: 0n,
            },
          ]
        : undefined,
    query: {
      enabled:
        contractsDeployed &&
        !!amountInParsed &&
        !!fromAddr &&
        !!toAddr &&
        fromAddr !== toAddr,
      retry: false,
    },
  });

  useEffect(() => {
    if (!debouncedAmount || !fromToken || !toToken || !amountInParsed) {
      setToAmount("");
      setQuoteError(null);
      setPriceImpact(null);
      setExecutionPrice(null);
      setFeeTier(null);
      setGasEstimate(null);
      setIsQuoting(false);
      return;
    }

    if (!contractsDeployed) {
      setToAmount("");
      setQuoteError("Contracts not deployed");
      setIsQuoting(false);
      return;
    }

    setIsQuoting(true);

    if (quoteErr) {
      // Try next fee tier
      const idx = FEE_TIERS.indexOf(activeFee);
      if (idx < FEE_TIERS.length - 1) {
        setActiveFee(FEE_TIERS[idx + 1]);
      } else {
        setIsQuoting(false);
        setToAmount("");
        setQuoteError("Insufficient liquidity");
        setFeeTier(null);
      }
      return;
    }

    if (quoteData) {
      const [amountOut, , , gas] = quoteData as [
        bigint,
        bigint,
        number,
        bigint
      ];
      const outFormatted = formatUnits(amountOut, toToken.decimals);
      setToAmount(outFormatted);
      setGasEstimate(gas);
      setFeeTier(activeFee);
      setQuoteError(null);
      setIsQuoting(false);

      // Execution price
      const inNum = Number(debouncedAmount);
      const outNum = Number(outFormatted);
      if (inNum > 0 && outNum > 0) {
        const price = outNum / inNum;
        setExecutionPrice(price.toFixed(6));
        // Approximate price impact: we don't have the spot price, so skip for now
        setPriceImpact(null);
      }
    }
  }, [
    quoteData,
    quoteErr,
    debouncedAmount,
    fromToken,
    toToken,
    amountInParsed,
    contractsDeployed,
    activeFee,
  ]);

  // Reset fee tier when tokens change
  useEffect(() => {
    setActiveFee(500);
    setToAmount("");
    setQuoteError(null);
    setPriceImpact(null);
    setExecutionPrice(null);
    setFeeTier(null);
  }, [fromToken, toToken]);

  const flipTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setToAmount("");
    setQuoteError(null);
    setPriceImpact(null);
    setExecutionPrice(null);
    setFeeTier(null);
    setActiveFee(500);
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
