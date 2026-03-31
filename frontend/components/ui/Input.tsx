import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, prefix, className = "", style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[var(--text-secondary)]">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full h-11 rounded-[12px] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 ${
              prefix ? "pl-10" : "pl-4"
            } ${suffix ? "pr-10" : "pr-4"} ${className}`}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-active)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(54,177,255,0.08)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-[var(--text-secondary)]">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
