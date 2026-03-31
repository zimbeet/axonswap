"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

const NAV_LINKS = [
  { href: "/swap", label: "Swap" },
  { href: "/pool", label: "Pool" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-6"
      style={{
        background: "rgba(10, 11, 15, 0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      {/* Logo */}
      <Link href="/swap" className="flex items-center gap-2">
        <span className="text-[18px] font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-blue)]">⚡</span> AxonSwap
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-150"
              style={{
                color: isActive
                  ? "var(--accent-blue)"
                  : "var(--text-secondary)",
                background: isActive
                  ? "rgba(54,177,255,0.10)"
                  : "transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connect Wallet */}
      <div>
        <RainbowConnectButton />
      </div>
    </header>
  );
}
