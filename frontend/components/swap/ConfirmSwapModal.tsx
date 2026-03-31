"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Token } from "@/lib/tokens";
import { formatAmount, priceImpactColor } from "@/lib/utils";
import { parseUnits } from "viem";
import { SwapTxStatus } from "@/hooks/useSwapExecution";

interface ConfirmSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  priceImpact: number | null;
  executionPrice: string | null;
  gasEstimate: bigint | null;
  feeTier: number | null;
  status: SwapTxStatus;
  txHash: `0x${string}` | undefined;
  error: string | null;
  onReset: () => void;
}

function fmtFee(fee: number | null): string {
  if (fee === null) return "—";
  if (fee === 500) return "0.05%";
  if (fee === 3000) return "0.3%";
  if (fee === 10000) return "1%";
  return `${fee / 10000}%`;
}

export function ConfirmSwapModal({
  isOpen,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  slippage,
  priceImpact,
  executionPrice,
  gasEstimate,
  feeTier,
  status,
  txHash,
  error,
  onReset,
}: ConfirmSwapModalProps) {
  const minReceived =
    toToken && toAmount
      ? (() => {
          try {
            const raw = parseUnits(toAmount, toToken.decimals);
            const min =
              (raw * BigInt(Math.floor((1 - slippage / 100) * 1_000_000))) /
              1_000_000n;
            return formatAmount(min, toToken.decimals, 6);
          } catch {
            return "—";
          }
        })()
      : "—";

  const isLoading =
    status === "pending_wallet" || status === "pending_tx";

  if (status === "confirmed" && txHash) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Swap Submitted">
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(54,255,166,0.12)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="var(--accent-green)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Transaction Submitted
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Swapping {fromAmount} {fromToken?.symbol} → {toAmount}{" "}
              {toToken?.symbol}
            </p>
          </div>
          <a
            href={`https://explorer.axonchain.ai/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            View on Explorer ↗
          </a>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  if (status === "error") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Transaction Failed">
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,87,87,0.12)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="var(--accent-red)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Transaction Failed
            </p>
            {error && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 break-all">
                {error.slice(0, 120)}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              onReset();
            }}
          >
            Try Again
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Swap">
      <div className="space-y-4 -mt-2">
        {/* Swap summary */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--bg-input)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold font-mono text-[var(--text-primary)]">
                {fromAmount}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {fromToken?.symbol}
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-right">
              <p className="text-2xl font-semibold font-mono text-[var(--text-primary)]">
                {Number(toAmount).toFixed(6)}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {toToken?.symbol}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {executionPrice && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Price</span>
              <span className="text-[var(--text-primary)] font-mono">
                1 {fromToken?.symbol} = {executionPrice} {toToken?.symbol}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              Minimum received
            </span>
            <span className="text-[var(--text-primary)] font-mono">
              {minReceived} {toToken?.symbol}
            </span>
          </div>
          {priceImpact !== null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Price Impact</span>
              <span className={`font-mono ${priceImpactColor(priceImpact)}`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              Slippage Tolerance
            </span>
            <span className="text-[var(--text-primary)]">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Fee Tier</span>
            <span className="text-[var(--text-primary)]">
              {fmtFee(feeTier)}
            </span>
          </div>
          {gasEstimate !== null && gasEstimate > 0n && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">
                Est. Gas Units
              </span>
              <span className="text-[var(--text-primary)] font-mono">
                {gasEstimate.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          className="w-full"
          size="lg"
          loading={isLoading}
          onClick={onConfirm}
        >
          {status === "pending_wallet"
            ? "Waiting for wallet…"
            : status === "pending_tx"
            ? "Transaction pending…"
            : "Confirm Swap"}
        </Button>
      </div>
    </Modal>
  );
}
