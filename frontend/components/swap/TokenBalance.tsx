"use client";

import { Token } from "@/lib/tokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";

interface TokenBalanceProps {
  token: Token | null;
  className?: string;
}

export function TokenBalance({ token, className = "" }: TokenBalanceProps) {
  const { formatted, isLoading } = useTokenBalance(token);

  if (!token) return null;

  return (
    <span className={`text-xs text-[var(--text-secondary)] ${className}`}>
      {isLoading ? "Loading…" : `Balance: ${formatted}`}
    </span>
  );
}
