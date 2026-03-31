"use client";

import { useEffect, useRef } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  onSlippageChange: (v: number) => void;
  deadline: number;
  onDeadlineChange: (v: number) => void;
}

const PRESET_SLIPPAGES = [0.1, 0.5, 1.0];

export function SettingsPanel({
  isOpen,
  onClose,
  slippage,
  onSlippageChange,
  deadline,
  onDeadlineChange,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isCustomSlippage = !PRESET_SLIPPAGES.includes(slippage);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slippageWarn = slippage > 5;
  const slippageError = slippage > 50 || slippage < 0;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-72 rounded-2xl p-4 space-y-4"
      style={{
        background: "rgba(18, 19, 26, 0.97)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* Slippage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Slippage Tolerance
          </span>
        </div>
        <div className="flex items-center gap-2">
          {PRESET_SLIPPAGES.map((p) => (
            <button
              key={p}
              onClick={() => onSlippageChange(p)}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background:
                  slippage === p
                    ? "rgba(54,177,255,0.15)"
                    : "var(--bg-input)",
                border:
                  slippage === p
                    ? "1px solid rgba(54,177,255,0.4)"
                    : "1px solid var(--border-default)",
                color:
                  slippage === p ? "var(--accent-blue)" : "var(--text-primary)",
              }}
            >
              {p}%
            </button>
          ))}
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              placeholder="Custom"
              value={isCustomSlippage ? slippage : ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onSlippageChange(v);
              }}
              className="w-full py-1.5 pl-2 pr-6 rounded-lg text-sm outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{
                background: isCustomSlippage
                  ? slippageError
                    ? "rgba(255,87,87,0.1)"
                    : slippageWarn
                    ? "rgba(255,213,87,0.1)"
                    : "rgba(54,177,255,0.1)"
                  : "var(--bg-input)",
                border: isCustomSlippage
                  ? slippageError
                    ? "1px solid rgba(255,87,87,0.5)"
                    : slippageWarn
                    ? "1px solid rgba(255,213,87,0.5)"
                    : "1px solid rgba(54,177,255,0.4)"
                  : "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
              %
            </span>
          </div>
        </div>
        {slippageError && (
          <p className="text-xs mt-1.5" style={{ color: "var(--accent-red)" }}>
            Slippage must be between 0% and 50%
          </p>
        )}
        {!slippageError && slippageWarn && (
          <p
            className="text-xs mt-1.5"
            style={{ color: "var(--accent-warning)" }}
          >
            High slippage — your trade may be frontrun
          </p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          Transaction Deadline
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="4320"
            value={deadline}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v > 0) onDeadlineChange(v);
            }}
            className="w-20 py-1.5 px-3 rounded-lg text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
          <span className="text-sm text-[var(--text-secondary)]">minutes</span>
        </div>
      </div>
    </div>
  );
}
