"use client";

const FEE_TIERS = [
  {
    value: 500,
    label: "0.05%",
    description: "Best for stable pairs",
    badge: "Stable",
    badgeColor: "var(--accent-green)",
  },
  {
    value: 3000,
    label: "0.30%",
    description: "Best for most pairs",
    badge: "Most Common",
    badgeColor: "var(--accent-blue)",
  },
  {
    value: 10000,
    label: "1.00%",
    description: "Best for exotic pairs",
    badge: "Exotic",
    badgeColor: "var(--accent-warning)",
  },
];

interface FeeSelectorProps {
  selected: number;
  onChange: (fee: number) => void;
}

export function FeeSelector({ selected, onChange }: FeeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FEE_TIERS.map((tier) => {
        const isSelected = selected === tier.value;
        return (
          <button
            key={tier.value}
            type="button"
            onClick={() => onChange(tier.value)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background: isSelected
                ? "rgba(54,177,255,0.1)"
                : "var(--bg-input)",
              border: isSelected
                ? "1px solid rgba(54,177,255,0.4)"
                : "1px solid var(--border-default)",
            }}
          >
            <div
              className="text-sm font-bold mb-0.5"
              style={{
                color: isSelected ? "var(--accent-blue)" : "var(--text-primary)",
              }}
            >
              {tier.label}
            </div>
            <div
              className="text-xs"
              style={{
                color: isSelected
                  ? "var(--accent-blue)"
                  : "var(--text-secondary)",
                opacity: 0.8,
              }}
            >
              {tier.description}
            </div>
            {isSelected && (
              <div
                className="text-[10px] mt-1 font-semibold"
                style={{ color: tier.badgeColor }}
              >
                ✓ {tier.badge}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
