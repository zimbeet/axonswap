"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { Token, isNativeToken } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, ERC20_ABI } from "@/lib/contracts";

export type LiquidityStatus =
  | "idle"
  | "approving"
  | "pending_wallet"
  | "pending_tx"
  | "success"
  | "error";

export function useLiquidity() {
  const { address } = useAccount();
  const [status, setStatus] = useState<LiquidityStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  const addLiquidity = useCallback(
    async (params: {
      token0: Token;
      token1: Token;
      fee: number;
      minPrice: string;
      maxPrice: string;
      isFullRange: boolean;
      amount0: string;
      amount1: string;
    }) => {
      if (!address) return;
      if (!CONTRACT_ADDRESSES.POSITION_MANAGER) {
        setError("Contracts not deployed yet.");
        return;
      }

      setError(null);
      setStatus("idle");

      try {
        // Approve token0 if needed
        if (!isNativeToken(params.token0) && params.token0.address) {
          setStatus("approving");
          const amount0Parsed = parseUnits(params.amount0 || "0", params.token0.decimals);
          await writeContractAsync({
            address: params.token0.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESSES.POSITION_MANAGER, amount0Parsed],
          });
        }

        // Approve token1 if needed
        if (!isNativeToken(params.token1) && params.token1.address) {
          setStatus("approving");
          const amount1Parsed = parseUnits(params.amount1 || "0", params.token1.decimals);
          await writeContractAsync({
            address: params.token1.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESSES.POSITION_MANAGER, amount1Parsed],
          });
        }

        setStatus("pending_wallet");
        // Position manager mint call would go here once contracts are deployed
        // For now we simulate by flagging that contracts aren't deployed
        setError("Contracts not deployed yet — add liquidity unavailable.");
        setStatus("error");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setStatus("error");
      }
    },
    [address, writeContractAsync]
  );

  const removeLiquidity = useCallback(
    async (_tokenId: string, _percentage: number) => {
      if (!address) return;
      if (!CONTRACT_ADDRESSES.POSITION_MANAGER) {
        setError("Contracts not deployed yet.");
        return;
      }
      setError("Contracts not deployed yet — remove liquidity unavailable.");
      setStatus("error");
    },
    [address]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(undefined);
    setError(null);
  }, []);

  return {
    status,
    txHash,
    error,
    isTxLoading,
    isTxSuccess,
    addLiquidity,
    removeLiquidity,
    reset,
  };
}
