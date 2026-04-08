import { useEffect, useRef, useState } from 'react'
import { createPublicClient, http, parseUnits, formatUnits, encodeFunctionData } from 'viem'
import { bscTestnet } from '@/config/chains'
import { CONTRACTS, NATIVE_TOKEN, type Token, FEE_TIERS } from '@/config'
import { QUOTER_V2_ABI } from '@/abi'

const client = createPublicClient({ chain: bscTestnet, transport: http() })

// Fee tiers to try, ordered by popularity
const FEE_TIER_LIST = [FEE_TIERS.MEDIUM, FEE_TIERS.LOW, FEE_TIERS.HIGH, FEE_TIERS.LOWEST]

function resolveAddress(token: Token): `0x${string}` {
  if (token.address === NATIVE_TOKEN.address) return CONTRACTS.WBNB as `0x${string}`
  return token.address as `0x${string}`
}

interface QuoteResult {
  amountOut: string
  amountOutRaw: bigint
  fee: number
  gasEstimate: bigint
}

/**
 * Fetches a quote from QuoterV2 for the given input.
 * Tries all fee tiers and returns the best quote.
 * QuoterV2.quoteExactInputSingle is a non-view function that reverts
 * with the result, so we use eth_call (simulateContract) to get the output.
 */
export function useQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  enabled: boolean = true,
) {
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Reset if no valid input
    if (!enabled || !amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null)
      setLoading(false)
      setError(null)
      return
    }

    const addrIn = resolveAddress(tokenIn)
    const addrOut = resolveAddress(tokenOut)
    if (addrIn.toLowerCase() === addrOut.toLowerCase()) {
      setQuote(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Debounce 500ms so we don't spam RPC on every keystroke
    debounceRef.current = setTimeout(async () => {
      try {
        const amountInRaw = parseUnits(amountIn, tokenIn.decimals)
        if (amountInRaw === 0n) {
          setQuote(null)
          setLoading(false)
          return
        }

        let bestQuote: QuoteResult | null = null

        // Try each fee tier, pick the best output
        for (const fee of FEE_TIER_LIST) {
          try {
            const result = await client.simulateContract({
              address: CONTRACTS.QuoterV2 as `0x${string}`,
              abi: QUOTER_V2_ABI,
              functionName: 'quoteExactInputSingle',
              args: [{
                tokenIn: addrIn,
                tokenOut: addrOut,
                amountIn: amountInRaw,
                fee,
                sqrtPriceLimitX96: 0n,
              }],
            })

            const [amountOutRaw, , , gasEstimate] = result.result as [bigint, bigint, number, bigint]

            if (!bestQuote || amountOutRaw > bestQuote.amountOutRaw) {
              bestQuote = {
                amountOut: formatUnits(amountOutRaw, tokenOut.decimals),
                amountOutRaw,
                fee,
                gasEstimate,
              }
            }
          } catch {
            // This fee tier doesn't have a pool or has no liquidity — skip
            continue
          }
        }

        if (bestQuote) {
          setQuote(bestQuote)
          setError(null)
        } else {
          setQuote(null)
          setError('No liquidity available for this pair')
        }
      } catch (err: any) {
        console.error('Quote error:', err)
        setQuote(null)
        setError('Failed to fetch quote')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals, enabled])

  return { quote, loading, error }
}
