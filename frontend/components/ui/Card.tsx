import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden transition-all duration-200 ${
          hover ? "hover:shadow-card-hover hover:border-[var(--border-hover)]" : ""
        } ${className}`}
        style={{
          background: "rgba(26, 28, 38, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border-default)",
          borderRadius: "20px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
