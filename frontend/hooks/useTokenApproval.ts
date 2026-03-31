"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { maxUint256 } from "viem";
import { Token } from "@/lib/tokens";
import { isNativeToken } from "@/lib/tokens";
import { CONTRACT_ADDRESSES, ERC20_ABI } from "@/lib/contracts";

export type ApprovalStatus = "idle" | "checking" | "approved" | "pending" | "confirmed" | "error";

export interface TokenApprovalResult {
  needsApproval: boolean;
  approve: () => void;
  status: ApprovalStatus;
  isLoading: boolean;
  error: string | null;
}

export function useTokenApproval(
  token: Token | null,
  amount: bigint
): TokenApprovalResult {
  const { address } = useAccount();
  const spender = CONTRACT_ADDRESSES.SWAP_ROUTER;

  const isNative = token ? isNativeToken(token) : false;
  const tokenAddress = token?.address as `0x${string}` | undefined;

  const { data: allowance, isLoading: allowanceLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled:
        !isNative &&
        !!address &&
        !!spender &&
        !!tokenAddress &&
        amount > 0n,
    },
  });

  const {
    writeContract,
    isPending,
    isSuccess,
    isError,
    error: writeError,
  } = useWriteContract();

  const approve = () => {
    if (!tokenAddress || !spender) return;
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, maxUint256],
    });
  };

  if (isNative || !token || !spender) {
    return {
      needsApproval: false,
      approve: () => {},
      status: "approved",
      isLoading: false,
      error: null,
    };
  }

  let status: ApprovalStatus = "idle";
  if (allowanceLoading) status = "checking";
  else if (isPending) status = "pending";
  else if (isSuccess) status = "confirmed";
  else if (isError) status = "error";
  else if (allowance !== undefined && allowance >= amount && amount > 0n)
    status = "approved";
  else status = "idle";

  const needsApproval =
    !isNative &&
    !!spender &&
    amount > 0n &&
    ((allowance ?? 0n) as bigint) < amount;

  return {
    needsApproval,
    approve,
    status,
    isLoading: allowanceLoading || isPending,
    error: isError ? (writeError?.message ?? "Approval failed") : null,
  };
}
