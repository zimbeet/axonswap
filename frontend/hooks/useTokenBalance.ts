"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { Token } from "@/lib/tokens";
import { isNativeToken } from "@/lib/tokens";
import { ERC20_ABI } from "@/lib/contracts";

export interface TokenBalanceResult {
  balance: bigint;
  formatted: string;
  isLoading: boolean;
}

export function useTokenBalance(token: Token | null): TokenBalanceResult {
  const { address } = useAccount();

  const isNative = token ? isNativeToken(token) : false;

  const { data: nativeData, isLoading: nativeLoading } = useBalance({
    address,
    query: { enabled: !!address && !!token && isNative },
  });

  const { data: erc20Data, isLoading: erc20Loading } = useReadContract({
    address: token?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token && !isNative && !!token?.address },
  });

  if (!token || !address) {
    return { balance: 0n, formatted: "—", isLoading: false };
  }

  if (isNative) {
    return {
      balance: nativeData?.value ?? 0n,
      formatted: nativeData
        ? Number(nativeData.formatted).toFixed(4)
        : "—",
      isLoading: nativeLoading,
    };
  }

  const raw = (erc20Data as bigint | undefined) ?? 0n;
  const decimals = token.decimals;
  const divisor = 10 ** decimals;
  const num = Number(raw) / divisor;

  return {
    balance: raw,
    formatted: erc20Loading ? "—" : num.toFixed(decimals <= 6 ? 4 : 6),
    isLoading: erc20Loading,
  };
}
