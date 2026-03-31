/**
 * Price formatting and calculation utilities for Uniswap V3 concentrated liquidity.
 *
 * sqrtPriceX96 is a Q64.96 fixed-point number where:
 *   price = (sqrtPriceX96 / 2^96)^2
 */

const Q96 = 2n ** 96n;

/**
 * Convert a Uniswap V3 sqrtPriceX96 value to a human-readable price.
 *
 * @param sqrtPriceX96 The sqrtPriceX96 value from the pool's slot0
 * @param decimals0    Decimals of token0
 * @param decimals1    Decimals of token1
 * @returns            Price of token0 denominated in token1
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number
): number {
  if (sqrtPriceX96 === 0n) return 0;
  // price_raw = (sqrtPriceX96 / 2^96)^2
  // We use floating point via Number() after squaring in bigint space,
  // scaling down to avoid overflow.
  const numerator = sqrtPriceX96 * sqrtPriceX96;
  const denominator = Q96 * Q96;
  // Convert to float — safe for typical price ranges
  const rawPrice = Number(numerator) / Number(denominator);
  return rawPrice * Math.pow(10, decimals0 - decimals1);
}

/**
 * Convert a human-readable price back to a sqrtPriceX96 value.
 *
 * @param price     The price of token0 in terms of token1
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 * @returns         sqrtPriceX96 as a bigint
 */
export function priceToSqrtPriceX96(
  price: number,
  decimals0: number,
  decimals1: number
): bigint {
  if (price <= 0) return 0n;
  const adjustedPrice = price / Math.pow(10, decimals0 - decimals1);
  const sqrtPrice = Math.sqrt(adjustedPrice);
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

/**
 * Format a price number to a readable string with a sensible number of
 * significant digits.
 *
 * @param price            The price value to format
 * @param significantDigits Number of significant figures (default 5)
 * @returns                Formatted price string
 */
export function formatPrice(price: number, significantDigits = 5): string {
  if (!isFinite(price) || isNaN(price)) return "—";
  if (price === 0) return "0";

  // Very small or very large prices — use exponential notation
  if (price < 1e-6 || price > 1e12) {
    return price.toExponential(significantDigits - 1);
  }

  // Count integer digits to determine how many decimal places we need
  const integerDigits = Math.max(1, Math.floor(Math.log10(price)) + 1);
  const decimalPlaces = Math.max(0, significantDigits - integerDigits);

  return price.toFixed(decimalPlaces);
}

/**
 * Calculate the amounts of token0 and token1 corresponding to a liquidity
 * position over the range [sqrtPriceAX96, sqrtPriceBX96] at the current
 * price sqrtPriceX96.
 *
 * This mirrors the Uniswap V3 LiquidityAmounts library logic.
 *
 * @param liquidity      Position liquidity (uint128 as bigint)
 * @param sqrtPriceX96   Current pool price
 * @param sqrtPriceAX96  Lower boundary sqrtPrice
 * @param sqrtPriceBX96  Upper boundary sqrtPrice
 * @returns              { amount0: bigint, amount1: bigint }
 */
export function calculateTokenAmounts(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint
): { amount0: bigint; amount1: bigint } {
  // Ensure sqrtPriceA <= sqrtPriceB
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  if (sqrtPriceX96 <= sqrtPriceAX96) {
    // Current price is below the range — all token0
    const amount0 =
      (liquidity * Q96 * (sqrtPriceBX96 - sqrtPriceAX96)) /
      (sqrtPriceBX96 * sqrtPriceAX96);
    return { amount0, amount1: 0n };
  }

  if (sqrtPriceX96 >= sqrtPriceBX96) {
    // Current price is above the range — all token1
    const amount1 = (liquidity * (sqrtPriceBX96 - sqrtPriceAX96)) / Q96;
    return { amount0: 0n, amount1 };
  }

  // Current price is within the range
  const amount0 =
    (liquidity * Q96 * (sqrtPriceBX96 - sqrtPriceX96)) /
    (sqrtPriceBX96 * sqrtPriceX96);
  const amount1 = (liquidity * (sqrtPriceX96 - sqrtPriceAX96)) / Q96;
  return { amount0, amount1 };
}
