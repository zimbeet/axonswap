"use client";

interface PriceRangeInputProps {
  minPrice: string;
  maxPrice: string;
  isFullRange: boolean;
  priceLabel: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  onFullRangeToggle: (full: boolean) => void;
}

export function PriceRangeInput({
  minPrice,
  maxPrice,
  isFullRange,
  priceLabel,
  onMinChange,
  onMaxChange,
  onFullRangeToggle,
}: PriceRangeInputProps) {
  return (
    <div>
      {/* Full Range Toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-secondary)]">
          Price range
        </span>
        <button
          type="button"
          onClick={() => onFullRangeToggle(!isFullRange)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: isFullRange ? "var(--accent-blue)" : "var(--text-secondary)" }}
        >
          <span
            className="w-8 h-4 rounded-full transition-all flex items-center px-0.5"
            style={{
              background: isFullRange
                ? "rgba(54,177,255,0.3)"
                : "var(--bg-input)",
              border: `1px solid ${isFullRange ? "rgba(54,177,255,0.4)" : "var(--border-default)"}`,
            }}
          >
            <span
              className="w-3 h-3 rounded-full transition-transform"
              style={{
                background: isFullRange ? "var(--accent-blue)" : "var(--text-tertiary)",
                transform: isFullRange ? "translateX(16px)" : "translateX(0)",
              }}
            />
          </span>
          Full Range
        </button>
      </div>

      {/* Range visualization bar */}
      <div
        className="h-2 rounded-full mb-3 relative overflow-hidden"
        style={{ background: "var(--bg-input)" }}
      >
        <div
          className="absolute inset-y-0 rounded-full transition-all"
          style={{
            left: isFullRange ? "0%" : "20%",
            right: isFullRange ? "0%" : "20%",
            background: isFullRange
              ? "linear-gradient(90deg, var(--accent-blue), var(--accent-violet))"
              : "linear-gradient(90deg, rgba(54,177,255,0.6), rgba(106,117,255,0.6))",
          }}
        />
      </div>

      {/* Min / Max inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-input)",
            border: `1px solid ${
              isFullRange ? "var(--border-default)" : "var(--border-hover)"
            }`,
          }}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-1">Min Price</p>
          <input
            type="number"
            placeholder="0.0"
            value={isFullRange ? "0" : minPrice}
            onChange={(e) => onMinChange(e.target.value)}
            disabled={isFullRange}
            className="w-full bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
          />
          {priceLabel && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {priceLabel}
            </p>
          )}
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-input)",
            border: `1px solid ${
              isFullRange ? "var(--border-default)" : "var(--border-hover)"
            }`,
          }}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-1">Max Price</p>
          <input
            type="text"
            placeholder="∞"
            value={isFullRange ? "∞" : maxPrice}
            onChange={(e) => onMaxChange(e.target.value)}
            disabled={isFullRange}
            className="w-full bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none disabled:opacity-50"
          />
          {priceLabel && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {priceLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
