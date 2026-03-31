import { formatUnits, parseUnits } from "viem";

/** Format a bigint amount to a human-readable string with up to `maxDecimals` decimal places */
export function formatAmount(
  amount: bigint,
  decimals: number,
  maxDecimals = 6
): string {
  const formatted = formatUnits(amount, decimals);
  const [whole, frac] = formatted.split(".");
  if (!frac) return whole;
  const trimmed = frac.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/** Parse a human-readable string to bigint, returning 0n on error */
export function parseAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === "." || isNaN(Number(amount))) return 0n;
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

/** Shorten a hex address to 0x1234…abcd format */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/** Returns true if s looks like a valid 0x address */
export function isAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

/** Color class for price impact */
export function priceImpactColor(impact: number | null): string {
  if (impact === null) return "text-[var(--text-secondary)]";
  if (impact < 1) return "text-[var(--accent-green)]";
  if (impact < 3) return "text-[var(--accent-warning)]";
  return "text-[var(--accent-red)]";
}
