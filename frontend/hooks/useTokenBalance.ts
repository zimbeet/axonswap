"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Token, isNativeToken } from "@/lib/tokens";
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
    const bal = nativeData?.value ?? 0n;
    const fmt = nativeData
      ? Number(formatUnits(bal, 18)).toFixed(4)
      : "—";
    return { balance: bal, formatted: fmt, isLoading: nativeLoading };
  }

  const raw = (erc20Data as bigint | undefined) ?? 0n;
  const fmt = erc20Loading
    ? "—"
    : Number(formatUnits(raw, token.decimals)).toFixed(token.decimals <= 6 ? 4 : 6);

  return { balance: raw, formatted: fmt, isLoading: erc20Loading };
}
