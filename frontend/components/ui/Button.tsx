import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "text-white bg-gradient-to-r from-[#36B1FF] to-[#6A75FF] shadow-[0_4px_20px_rgba(54,177,255,0.3)] hover:shadow-[0_0_30px_rgba(54,177,255,0.4),0_4px_16px_rgba(106,117,255,0.3)] hover:brightness-110",
      secondary:
        "text-[var(--accent-blue)] bg-[rgba(54,177,255,0.08)] border border-[rgba(54,177,255,0.2)] hover:bg-[rgba(54,177,255,0.14)] hover:border-[rgba(54,177,255,0.4)]",
      ghost:
        "text-[var(--text-secondary)] bg-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]",
      icon: "text-[var(--text-secondary)] bg-[var(--bg-input)] border border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-9 px-4 text-sm rounded-[12px]",
      md: "h-10 px-5 text-sm rounded-[12px]",
      lg: "h-[52px] px-6 text-base rounded-[16px]",
    };

    const effectiveSize = variant === "icon" ? "md" : size;
    const combinedClassName = `${base} ${variantStyles[variant]} ${sizeStyles[effectiveSize]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedClassName}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
