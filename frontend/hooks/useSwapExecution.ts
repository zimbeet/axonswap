"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { Token } from "@/lib/tokens";
import { isNativeToken } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, SWAP_ROUTER_ABI } from "@/lib/contracts";

export type SwapTxStatus =
  | "idle"
  | "pending_wallet"
  | "pending_tx"
  | "confirmed"
  | "error";

export interface SwapExecutionResult {
  execute: () => void;
  status: SwapTxStatus;
  txHash: `0x${string}` | undefined;
  reset: () => void;
  error: string | null;
}

export function useSwapExecution(
  fromToken: Token | null,
  toToken: Token | null,
  fromAmount: string,
  toAmount: string,
  slippage: number,
  deadline: number
): SwapExecutionResult {
  const { address } = useAccount();

  const {
    writeContract,
    data: txHash,
    isPending,
    isError,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  const execute = () => {
    if (
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !toAmount ||
      !address ||
      !CONTRACT_ADDRESSES.SWAP_ROUTER
    )
      return;

    const fromIsNative = isNativeToken(fromToken);
    const toIsNative = isNativeToken(toToken);

    const tokenIn = fromIsNative
      ? CONTRACT_ADDRESSES.WAXON
      : (fromToken.address as `0x${string}`);
    const tokenOut = toIsNative
      ? CONTRACT_ADDRESSES.WAXON
      : (toToken.address as `0x${string}`);

    const amountIn = (() => {
      try {
        return parseUnits(fromAmount, fromToken.decimals);
      } catch {
        return 0n;
      }
    })();

    const amountOut = (() => {
      try {
        return parseUnits(toAmount, toToken.decimals);
      } catch {
        return 0n;
      }
    })();

    const amountOutMinimum =
      (amountOut * BigInt(Math.floor((1 - slippage / 100) * 1_000_000))) /
      1_000_000n;

    const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);

    writeContract({
      address: CONTRACT_ADDRESSES.SWAP_ROUTER,
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          fee: 3000,
          recipient: address,
          deadline: deadlineTs,
          amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        },
      ],
      value: fromIsNative ? amountIn : 0n,
    });
  };

  let status: SwapTxStatus = "idle";
  if (isPending) status = "pending_wallet";
  else if (isTxLoading) status = "pending_tx";
  else if (isTxSuccess) status = "confirmed";
  else if (isError) status = "error";

  return {
    execute,
    status,
    txHash,
    reset,
    error: isError ? (writeError?.message ?? "Transaction failed") : null,
  };
}
