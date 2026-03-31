"use client";

import { useState, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Modal } from "@/components/ui/Modal";
import { Token, DEFAULT_TOKEN_LIST, isNativeToken, COMMON_TOKENS } from "@/lib/tokens";
import { ERC20_ABI } from "@/lib/contracts";
import { isAddress } from "@/lib/utils";
import { useTokenBalance } from "@/hooks/useTokenBalance";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken: Token | null;
  disabledToken: Token | null;
  chainId: number;
}

function TokenLogo({ token }: { token: Token }) {
  const colors: Record<string, string> = {
    AXON: "#36B1FF",
    WAXON: "#6A75FF",
    USDC: "#2775CA",
    USDT: "#26A17B",
    WBTC: "#F7931A",
    WETH: "#627EEA",
  };
  const bg = colors[token.symbol] ?? "#4A4F5C";
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: bg }}
    >
      {token.symbol[0]}
    </div>
  );
}

function TokenRowBalance({ token }: { token: Token }) {
  const { formatted } = useTokenBalance(token);
  return (
    <span className="text-xs text-[var(--text-secondary)]">{formatted}</span>
  );
}

interface ImportTokenRowProps {
  address: string;
  chainId: number;
  onImport: (token: Token) => void;
}

function ImportTokenRow({ address, chainId, onImport }: ImportTokenRowProps) {
  const { data: nameData } = useReadContract({
    address: address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "name",
  });
  const { data: symbolData } = useReadContract({
    address: address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
  });
  const { data: decimalsData } = useReadContract({
    address: address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const name = nameData as string | undefined;
  const symbol = symbolData as string | undefined;
  const decimals = decimalsData as number | undefined;

  if (!name || !symbol || decimals === undefined) {
    return (
      <div className="flex items-center gap-3 p-3 text-[var(--text-secondary)] text-sm">
        <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] animate-pulse" />
        <span>Loading token info…</span>
      </div>
    );
  }

  const token: Token = {
    chainId,
    address,
    name,
    symbol,
    decimals,
  };

  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TokenLogo token={token} />
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {symbol}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{name}</div>
          </div>
        </div>
        <button
          onClick={() => onImport(token)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #36B1FF, #6A75FF)",
          }}
        >
          Import
        </button>
      </div>
      <div
        className="mt-2 text-xs px-2 py-1.5 rounded-lg"
        style={{
          background: "rgba(255,213,87,0.08)",
          color: "var(--accent-warning)",
          border: "1px solid rgba(255,213,87,0.2)",
        }}
      >
        ⚠️ This token is not in the default list. Trade at your own risk.
      </div>
    </div>
  );
}

export function TokenSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  disabledToken,
  chainId,
}: TokenSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [importedTokens, setImportedTokens] = useState<Token[]>([]);
  const { isConnected } = useAccount();

  const allTokens = useMemo(
    () => [...DEFAULT_TOKEN_LIST, ...importedTokens],
    [importedTokens]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTokens;
    return allTokens.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [allTokens, search]);

  const searchIsAddress = isAddress(search.trim());
  const isCustomAddress =
    searchIsAddress &&
    !allTokens.some(
      (t) => t.address.toLowerCase() === search.trim().toLowerCase()
    );

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearch("");
  };

  const handleImport = (token: Token) => {
    setImportedTokens((prev) => [...prev, token]);
    handleSelect(token);
  };

  const commonTokens = DEFAULT_TOKEN_LIST.filter((t) =>
    COMMON_TOKENS.includes(t.symbol)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a token">
      <div className="space-y-4 -mt-2">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search name or paste address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
            }}
            autoFocus
          />
        </div>

        {/* Common tokens */}
        <div className="flex flex-wrap gap-2">
          {commonTokens.map((token) => {
            const isDisabled =
              disabledToken?.symbol === token.symbol &&
              disabledToken?.address === token.address;
            return (
              <button
                key={token.symbol}
                onClick={() => !isDisabled && handleSelect(token)}
                disabled={isDisabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    selectedToken?.symbol === token.symbol
                      ? "rgba(54,177,255,0.2)"
                      : "var(--bg-input)",
                  border:
                    selectedToken?.symbol === token.symbol
                      ? "1px solid rgba(54,177,255,0.4)"
                      : "1px solid var(--border-default)",
                  color:
                    selectedToken?.symbol === token.symbol
                      ? "var(--accent-blue)"
                      : "var(--text-primary)",
                }}
              >
                <span>{token.symbol}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{ borderTop: "1px solid var(--border-default)" }}
          className="pt-3"
        />

        {/* Token list */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {isCustomAddress ? (
            <ImportTokenRow
              address={search.trim()}
              chainId={chainId}
              onImport={handleImport}
            />
          ) : filtered.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] text-sm py-8">
              No tokens found
            </div>
          ) : (
            filtered.map((token) => {
              const isDisabled =
                disabledToken?.symbol === token.symbol &&
                disabledToken?.address === token.address;
              const isSelected =
                selectedToken?.symbol === token.symbol &&
                selectedToken?.address === token.address;

              return (
                <button
                  key={`${token.symbol}-${token.address}`}
                  onClick={() => !isDisabled && handleSelect(token)}
                  disabled={isDisabled}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isSelected
                      ? "rgba(54,177,255,0.08)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(54,177,255,0.2)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isSelected) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-input)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background =
                        isSelected ? "rgba(54,177,255,0.08)" : "transparent";
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <TokenLogo token={token} />
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {token.name}
                      </div>
                    </div>
                  </div>
                  {isConnected && !isNativeToken(token) && token.address && (
                    <TokenRowBalance token={token} />
                  )}
                  {isNativeToken(token) && isConnected && (
                    <TokenRowBalance token={token} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
