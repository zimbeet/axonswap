"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card
        hover
        className="p-6 h-full cursor-pointer group-hover:scale-[1.02] transition-transform duration-200"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(54,177,255,0.15), rgba(106,117,255,0.15))",
            border: "1px solid rgba(54,177,255,0.2)",
          }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
        <div
          className="mt-4 flex items-center gap-1 text-sm font-medium"
          style={{ color: "var(--accent-blue)" }}
        >
          Get started
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Card>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl font-bold mb-1"
        style={{
          background: "linear-gradient(135deg, #36B1FF, #6A75FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-128px)] overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(54,177,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(106,117,255,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-20 animate-[fadeInUp_0.6s_ease-out]">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(54,177,255,0.1)",
              border: "1px solid rgba(54,177,255,0.2)",
              color: "var(--accent-blue)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            Live on Axonchain · Chain ID 8210
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
            <span className="text-[var(--text-primary)]">⚡ </span>
            <span
              style={{
                background: "linear-gradient(135deg, #36B1FF 0%, #6A75FF 50%, #36FFA6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AxonSwap
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-10 leading-relaxed">
            The Decentralized Exchange for Axonchain. Swap tokens and provide
            concentrated liquidity with minimal slippage.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/swap">
              <Button size="lg" variant="primary">
                Start Trading
              </Button>
            </Link>
            <Link href="/pool">
              <Button size="lg" variant="secondary">
                View Pools
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-20"
          style={{
            background: "rgba(26, 28, 38, 0.6)",
            border: "1px solid var(--border-default)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="grid grid-cols-3 gap-6">
            <StatCard label="Total Value Locked" value="$—" />
            <StatCard label="Total Volume" value="$—" />
            <StatCard label="Total Pools" value="—" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          <FeatureCard
            icon="🔄"
            title="Swap"
            description="Trade tokens instantly with minimal slippage using our concentrated liquidity AMM."
            href="/swap"
          />
          <FeatureCard
            icon="💧"
            title="Pool"
            description="Provide liquidity and earn trading fees from every swap in your price range."
            href="/pool"
          />
          <FeatureCard
            icon="➕"
            title="Add Liquidity"
            description="Create concentrated liquidity positions and maximize your capital efficiency."
            href="/add"
          />
        </div>

        {/* Axonchain badge */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl"
            style={{
              background: "rgba(26, 28, 38, 0.75)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(54,177,255,0.2), rgba(106,117,255,0.2))",
              }}
            >
              ⚡
            </div>
            <div className="text-left">
              <div className="text-xs text-[var(--text-secondary)]">
                Built on
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Axonchain
              </div>
            </div>
            <div
              className="h-6 w-px"
              style={{ background: "var(--border-default)" }}
            />
            <div className="text-left">
              <div className="text-xs text-[var(--text-secondary)]">
                Chain ID
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--accent-blue)]">
                8210
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
