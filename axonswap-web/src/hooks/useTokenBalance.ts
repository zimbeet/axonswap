import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { Token } from '@/config'
import { NATIVE_TOKEN } from '@/config'
import { ERC20_ABI } from '@/abi'

/**
 * Returns formatted balance string for a token.
 * For native token (tBNB), uses eth_getBalance.
 * For ERC20 tokens, calls balanceOf.
 */
export function useTokenBalance(token: Token | null | undefined) {
  const { address } = useAccount()
  const isNative = token?.address === NATIVE_TOKEN.address

  // Native balance
  const { data: nativeData } = useBalance({
    address,
    query: { enabled: !!address && isNative },
  })

  // ERC20 balance
  const { data: erc20Data } = useReadContract({
    address: token?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token && !isNative },
  })

  if (!address || !token) return { balance: undefined, formatted: '' }

  if (isNative && nativeData) {
    return {
      balance: nativeData.value,
      formatted: formatBalance(formatUnits(nativeData.value, token.decimals)),
    }
  }

  if (!isNative && erc20Data !== undefined) {
    return {
      balance: erc20Data as bigint,
      formatted: formatBalance(formatUnits(erc20Data as bigint, token.decimals)),
    }
  }

  return { balance: undefined, formatted: '' }
}

/** Format balance: exact numbers up to 1B, integer above 1B */
function formatBalance(value: string): string {
  const num = parseFloat(value)
  if (num === 0) return '0'
  if (num < 0.000001) return '<0.000001'
  if (num >= 1_000_000_000) {
    return Math.floor(num).toLocaleString('en-US')
  }
  if (num >= 1) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }
  // Small numbers: up to 6 decimals, strip trailing zeros
  return parseFloat(num.toFixed(6)).toString()
}
