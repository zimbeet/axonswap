"use client";

import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function Skeleton({
  width,
  height,
  rounded = "rounded-lg",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${rounded} ${className}`}
      style={{
        background:
          "linear-gradient(90deg, var(--bg-input) 0%, var(--bg-card-hover) 50%, var(--bg-input) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          rounded="rounded-md"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function PoolCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3 py-4 px-2"
      style={{ borderTop: "1px solid var(--border-default)" }}
    >
      <Skeleton width={24} height={24} rounded="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton width={120} height={16} rounded="rounded-md" />
        <Skeleton width={60} height={12} rounded="rounded-md" />
      </div>
      <Skeleton width={60} height={16} rounded="rounded-md" />
      <Skeleton width={60} height={16} rounded="rounded-md" />
      <Skeleton width={60} height={16} rounded="rounded-md" />
    </div>
  );
}
