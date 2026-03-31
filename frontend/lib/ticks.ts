/**
 * Tick math utilities for Uniswap V3 concentrated liquidity.
 *
 * Uniswap V3 price = 1.0001^tick
 * Each tick represents a 0.01% price move.
 */

export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

/** Tick spacing per fee tier. Must match the contract constants. */
export const TICK_SPACINGS: Record<number, number> = {
  500: 10,
  3000: 60,
  10000: 200,
};

/**
 * Return the tick spacing for a given fee tier.
 * Falls back to 60 (the 0.30% tier) for unknown fee values.
 */
export function getTickSpacing(fee: number): number {
  return TICK_SPACINGS[fee] ?? 60;
}

/**
 * Convert a tick index to a human-readable price.
 *
 * price = 1.0001^tick × 10^(decimals0 - decimals1)
 *
 * @param tick      The tick value
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 * @returns         Price of token0 denominated in token1
 */
export function tickToPrice(
  tick: number,
  decimals0: number,
  decimals1: number
): number {
  const rawPrice = Math.pow(1.0001, tick);
  return rawPrice * Math.pow(10, decimals0 - decimals1);
}

/**
 * Convert a human-readable price to the nearest tick.
 *
 * tick = log(price × 10^(decimals1 - decimals0)) / log(1.0001)
 *
 * @param price     The price of token0 in terms of token1
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 * @returns         The nearest tick (not yet snapped to tick spacing)
 */
export function priceToTick(
  price: number,
  decimals0: number,
  decimals1: number
): number {
  if (price <= 0) return MIN_TICK;
  const adjustedPrice = price / Math.pow(10, decimals0 - decimals1);
  return Math.round(Math.log(adjustedPrice) / Math.log(1.0001));
}

/**
 * Snap a tick to the nearest valid tick that is a multiple of tickSpacing.
 *
 * @param tick        Any tick value
 * @param tickSpacing The spacing between valid ticks (e.g. 10, 60, 200)
 * @returns           The nearest valid tick, clamped to [MIN_TICK, MAX_TICK]
 */
export function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  return Math.max(MIN_TICK, Math.min(MAX_TICK, rounded));
}

/**
 * Return the minimum valid tick for a given tick spacing.
 * (Must be >= MIN_TICK and a multiple of tickSpacing.)
 */
export function minUsableTick(tickSpacing: number): number {
  return Math.ceil(MIN_TICK / tickSpacing) * tickSpacing;
}

/**
 * Return the maximum valid tick for a given tick spacing.
 * (Must be <= MAX_TICK and a multiple of tickSpacing.)
 */
export function maxUsableTick(tickSpacing: number): number {
  return Math.floor(MAX_TICK / tickSpacing) * tickSpacing;
}
