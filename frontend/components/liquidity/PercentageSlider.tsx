"use client";

const PRESETS = [25, 50, 75, 100];

interface PercentageSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function PercentageSlider({ value, onChange }: PercentageSliderProps) {
  return (
    <div>
      {/* Value display */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl font-bold text-[var(--text-primary)]">
          {value}%
        </span>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:
                  value === p
                    ? "rgba(54,177,255,0.15)"
                    : "var(--bg-input)",
                color:
                  value === p ? "var(--accent-blue)" : "var(--text-secondary)",
                border: `1px solid ${
                  value === p
                    ? "rgba(54,177,255,0.4)"
                    : "var(--border-default)"
                }`,
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={
            {
              background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-violet) ${value}%, var(--bg-input) ${value}%, var(--bg-input) 100%)`,
              "--thumb-color": "white",
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
