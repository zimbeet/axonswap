"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseUnits } from "viem";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TokenSelectorModal } from "@/components/swap/TokenSelectorModal";
import { SettingsPanel } from "@/components/swap/SettingsPanel";
import { ConfirmSwapModal } from "@/components/swap/ConfirmSwapModal";
import { SwapPriceInfo } from "@/components/swap/SwapPriceInfo";
import { TokenBalance } from "@/components/swap/TokenBalance";
import { useSwap } from "@/hooks/useSwap";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Token, AXON_CHAIN_ID, isNativeToken } from "@/lib/tokens";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

/** Gas reserve for native AXON swaps to avoid sweeping all funds */
const NATIVE_GAS_BUFFER = parseUnits("0.001", 18);

function ArrowDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M3 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TokenButtonProps {
  token: Token | null;
  onClick: () => void;
}

function TokenButton({ token, onClick }: TokenButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm flex-shrink-0 transition-all"
      style={{
        background: token
          ? "rgba(54,177,255,0.1)"
          : "linear-gradient(135deg, rgba(54,177,255,0.2), rgba(106,117,255,0.2))",
        color: "var(--accent-blue)",
        border: "1px solid rgba(54,177,255,0.2)",
      }}
    >
      <span>{token ? token.symbol : "Select token"}</span>
      <ChevronDownIcon />
    </button>
  );
}

export default function SwapPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const {
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
  } = useSwap();

  const [fromSelectorOpen, setFromSelectorOpen] = useState(false);
  const [toSelectorOpen, setToSelectorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { balance: fromBalance } = useTokenBalance(fromToken);

  const fromAmountParsed =
    fromToken && fromAmount
      ? (() => {
          try {
            return parseUnits(fromAmount, fromToken.decimals);
          } catch {
            return 0n;
          }
        })()
      : 0n;

  const { needsApproval, approve, status: approvalStatus } = useTokenApproval(
    fromToken,
    fromAmountParsed
  );

  const {
    execute: executeSwap,
    status: swapStatus,
    txHash,
    reset: resetSwap,
    error: swapError,
  } = useSwapExecution(fromToken, toToken, fromAmount, toAmount, slippage, deadline, feeTier);

  const contractsDeployed = !!CONTRACT_ADDRESSES.SWAP_ROUTER;
  const hasAmount = !!fromAmount && Number(fromAmount) > 0;
  const hasQuote = !!toAmount && !quoteError;
  const sameToken =
    fromToken &&
    toToken &&
    fromToken.symbol === toToken.symbol &&
    fromToken.address === toToken.address;

  const insufficientBalance =
    isConnected &&
    hasAmount &&
    fromBalance > 0n &&
    fromAmountParsed > fromBalance;

  const handleMax = () => {
    if (!fromToken || fromBalance === 0n) return;
    let maxVal = fromBalance;
    if (isNativeToken(fromToken)) {
      maxVal = maxVal > NATIVE_GAS_BUFFER ? maxVal - NATIVE_GAS_BUFFER : 0n;
    }
    const decimals = fromToken.decimals;
    const divisor = 10 ** decimals;
    setFromAmount((Number(maxVal) / divisor).toFixed(decimals));
  };

  const getSwapButton = () => {
    if (!isConnected) {
      return (
        <Button
          variant="primary"
          className="w-full"
          size="lg"
          onClick={openConnectModal}
        >
          Connect Wallet
        </Button>
      );
    }

    if (!fromToken || !toToken) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          Select tokens
        </Button>
      );
    }

    if (sameToken) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          Invalid pair
        </Button>
      );
    }

    if (!contractsDeployed) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          Contracts not deployed
        </Button>
      );
    }

    if (!hasAmount) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          Enter an amount
        </Button>
      );
    }

    if (insufficientBalance) {
      return (
        <button
          disabled
          className="w-full h-[52px] px-6 text-base rounded-[16px] font-semibold opacity-80 cursor-not-allowed"
          style={{
            background: "rgba(255,87,87,0.15)",
            color: "var(--accent-red)",
            border: "1px solid rgba(255,87,87,0.3)",
          }}
        >
          Insufficient {fromToken?.symbol} balance
        </button>
      );
    }

    if (isQuoting) {
      return (
        <Button variant="primary" className="w-full" size="lg" loading>
          Fetching quote…
        </Button>
      );
    }

    if (quoteError) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          {quoteError === "Contracts not deployed"
            ? "Contracts not deployed"
            : "Insufficient liquidity"}
        </Button>
      );
    }

    if (!hasQuote) {
      return (
        <Button variant="primary" className="w-full" size="lg" disabled>
          Enter an amount
        </Button>
      );
    }

    if (needsApproval) {
      if (approvalStatus === "pending") {
        return (
          <Button variant="primary" className="w-full" size="lg" loading>
            Approving…
          </Button>
        );
      }
      return (
        <Button
          variant="primary"
          className="w-full"
          size="lg"
          onClick={approve}
        >
          Approve {fromToken?.symbol}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        className="w-full"
        size="lg"
        onClick={() => setConfirmOpen(true)}
      >
        Swap
      </Button>
    );
  };

  const showPriceInfo = !!(fromToken && toToken && (toAmount || isQuoting));

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)] px-4 py-12">
      <div className="w-full max-w-[480px]">
        <Card className="p-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
              Swap
            </h2>
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: settingsOpen
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                  background: settingsOpen
                    ? "rgba(54,177,255,0.1)"
                    : undefined,
                }}
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>
              <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                slippage={slippage}
                onSlippageChange={setSlippage}
                deadline={deadline}
                onDeadlineChange={setDeadline}
              />
            </div>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {/* From */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-input)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Sell
                </span>
                <div className="flex items-center gap-1">
                  {isConnected && fromToken ? (
                    <TokenBalance token={fromToken} />
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Balance: —
                    </span>
                  )}
                  {isConnected && fromBalance > 0n && (
                    <button
                      onClick={handleMax}
                      className="text-xs font-medium ml-1"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <TokenButton
                  token={fromToken}
                  onClick={() => setFromSelectorOpen(true)}
                />
              </div>
            </div>

            {/* Flip */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                onClick={flipTokens}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: "var(--bg-card)",
                  border: "4px solid var(--bg-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowDownIcon />
              </button>
            </div>

            {/* To */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-input)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Buy
                </span>
                {isConnected && toToken ? (
                  <TokenBalance token={toToken} />
                ) : (
                  <span className="text-xs text-[var(--text-secondary)]">
                    Balance: —
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isQuoting ? (
                  <div
                    className="flex-1 h-8 rounded-lg animate-pulse"
                    style={{ background: "var(--bg-card)" }}
                  />
                ) : (
                  <input
                    type="number"
                    placeholder="0.0"
                    value={toAmount ? Number(toAmount).toFixed(6) : ""}
                    readOnly
                    className="flex-1 bg-transparent text-2xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
                <TokenButton
                  token={toToken}
                  onClick={() => setToSelectorOpen(true)}
                />
              </div>
            </div>

            {/* Price Info */}
            {showPriceInfo && (
              <SwapPriceInfo
                fromToken={fromToken}
                toToken={toToken}
                toAmount={toAmount}
                executionPrice={executionPrice}
                priceImpact={priceImpact}
                slippage={slippage}
                feeTier={feeTier}
                isQuoting={isQuoting}
              />
            )}

            {/* Action */}
            <div className="pt-1">{getSwapButton()}</div>
          </div>
        </Card>
      </div>

      <TokenSelectorModal
        isOpen={fromSelectorOpen}
        onClose={() => setFromSelectorOpen(false)}
        onSelect={(t: Token) => {
          setFromToken(t);
          setFromAmount("");
        }}
        selectedToken={fromToken}
        disabledToken={toToken}
        chainId={AXON_CHAIN_ID}
      />
      <TokenSelectorModal
        isOpen={toSelectorOpen}
        onClose={() => setToSelectorOpen(false)}
        onSelect={(t: Token) => {
          setToToken(t);
        }}
        selectedToken={toToken}
        disabledToken={fromToken}
        chainId={AXON_CHAIN_ID}
      />
      <ConfirmSwapModal
        isOpen={confirmOpen}
        onClose={() => {
          if (swapStatus !== "pending_wallet" && swapStatus !== "pending_tx") {
            setConfirmOpen(false);
          }
        }}
        onConfirm={executeSwap}
        fromToken={fromToken}
        toToken={toToken}
        fromAmount={fromAmount}
        toAmount={toAmount}
        slippage={slippage}
        priceImpact={priceImpact}
        executionPrice={executionPrice}
        gasEstimate={gasEstimate}
        feeTier={feeTier}
        status={swapStatus}
        txHash={txHash}
        error={swapError}
        onReset={() => {
          resetSwap();
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
