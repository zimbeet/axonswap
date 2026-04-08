import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, Loader2, Droplets, AlertTriangle, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { createPublicClient, http, formatUnits, parseUnits, maxUint256, encodeFunctionData } from 'viem'
import { CONTRACTS, NATIVE_TOKEN, DEFAULT_TOKENS, FEE_TIERS, type Token } from '@/config'
import { bscTestnet } from '@/config/chains'
import { POSITION_MANAGER_ABI, FACTORY_ABI, POOL_ABI, ERC20_ABI } from '@/abi'
import { TokenIcon, TokenSelector } from '@/components/TokenSelector'
import { useSwapStore } from '@/store/swap'
import { useTokenBalance } from '@/hooks/useTokenBalance'

const viemClient = createPublicClient({ chain: bscTestnet, transport: http() })

const FEE_LABEL: Record<number, string> = {
  100: '0.01%',
  500: '0.05%',
  3000: '0.30%',
  10000: '1.00%',
}

interface PositionData {
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
  token0Symbol: string
  token1Symbol: string
  token0Decimals: number
  token1Decimals: number
  amount0: number
  amount1: number
}

function resolveTokenInfo(address: string): { symbol: string; decimals: number } {
  const lower = address.toLowerCase()
  for (const t of DEFAULT_TOKENS) {
    if (t.address.toLowerCase() === lower) return { symbol: t.symbol, decimals: t.decimals }
  }
  if (lower === CONTRACTS.WBNB.toLowerCase()) return { symbol: 'WBNB', decimals: 18 }
  return { symbol: address.slice(0, 6) + '...' + address.slice(-4), decimals: 18 }
}

function getTokenAmounts(
  liquidity: bigint, sqrtPriceX96: bigint, currentTick: number,
  tickLower: number, tickUpper: number,
): { amount0: number; amount1: number } {
  const sqrtPriceCurrent = Number(sqrtPriceX96) / 2 ** 96
  const sqrtPriceLower = Math.sqrt(1.0001 ** tickLower)
  const sqrtPriceUpper = Math.sqrt(1.0001 ** tickUpper)
  const liq = Number(liquidity)
  if (liq === 0) return { amount0: 0, amount1: 0 }
  if (currentTick < tickLower) {
    return { amount0: liq * (1 / sqrtPriceLower - 1 / sqrtPriceUpper), amount1: 0 }
  } else if (currentTick >= tickUpper) {
    return { amount0: 0, amount1: liq * (sqrtPriceUpper - sqrtPriceLower) }
  }
  return {
    amount0: liq * (1 / sqrtPriceCurrent - 1 / sqrtPriceUpper),
    amount1: liq * (sqrtPriceCurrent - sqrtPriceLower),
  }
}

function formatAmount(raw: number, decimals: number): string {
  const val = raw / 10 ** decimals
  if (val === 0) return '0'
  if (val < 0.000001) return '<0.000001'
  if (val >= 1_000_000_000) return Math.floor(val).toLocaleString('en-US')
  if (val >= 1) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
  return parseFloat(val.toPrecision(6)).toString()
}

function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, dec0: number, dec1: number): number {
  const sqrtP = Number(sqrtPriceX96) / 2 ** 96
  return sqrtP * sqrtP * 10 ** (dec0 - dec1)
}

const REMOVE_PERCENTAGES = [25, 50, 75, 100] as const

export function PositionDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pmAddress = searchParams.get('pm') as `0x${string}` | null
  const tokenIdStr = searchParams.get('id')
  const tokenId = tokenIdStr ? BigInt(tokenIdStr) : null

  const { address, isConnected } = useAccount()
  const { deadline } = useSwapStore()
  const { writeContractAsync } = useWriteContract()

  const [position, setPosition] = useState<PositionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tab: 'overview' | 'add' | 'remove'
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'remove'>('overview')

  // Remove state
  const [removePercent, setRemovePercent] = useState(100)
  const [removeStatus, setRemoveStatus] = useState<'idle' | 'removing' | 'done' | 'error'>('idle')
  const [removeError, setRemoveError] = useState('')
  const [receiveNative, setReceiveNative] = useState(true)

  // Add state
  const [addAmount0, setAddAmount0] = useState('')
  const [addAmount1, setAddAmount1] = useState('')
  const [addStatus, setAddStatus] = useState<'idle' | 'approving0' | 'approving1' | 'minting' | 'done'>('idle')
  const [addError, setAddError] = useState('')
  const [poolPrice, setPoolPrice] = useState<number | null>(null)
  const [addUseNative, setAddUseNative] = useState(true) // true = use tBNB instead of WBNB when adding

  const isLegacy = pmAddress !== CONTRACTS.NonfungiblePositionManager

  // Check if position involves WBNB
  const hasWBNB = useMemo(() => {
    if (!position) return { token0IsWBNB: false, token1IsWBNB: false }
    return {
      token0IsWBNB: position.token0.toLowerCase() === CONTRACTS.WBNB.toLowerCase(),
      token1IsWBNB: position.token1.toLowerCase() === CONTRACTS.WBNB.toLowerCase(),
    }
  }, [position])

  const hasNativeToken = hasWBNB.token0IsWBNB || hasWBNB.token1IsWBNB

  // Resolved display tokens for add-liquidity — use tBNB when addUseNative and position has WBNB
  const resolvedTokens = useMemo(() => {
    if (!position) return null
    const findToken = (addr: string, isWBNBSide: boolean): Token => {
      if (isWBNBSide && addUseNative) return NATIVE_TOKEN
      const lower = addr.toLowerCase()
      const found = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === lower)
      if (found) return found
      if (lower === CONTRACTS.WBNB.toLowerCase()) {
        return DEFAULT_TOKENS.find(t => t.symbol === 'WBNB') || { symbol: 'WBNB', name: 'Wrapped BNB', address: CONTRACTS.WBNB, decimals: 18 }
      }
      return { symbol: addr.slice(0, 6) + '...', name: 'Unknown', address: addr, decimals: 18 }
    }
    return {
      token0: findToken(position.token0, hasWBNB.token0IsWBNB),
      token1: findToken(position.token1, hasWBNB.token1IsWBNB),
    }
  }, [position, hasWBNB, addUseNative])

  // Token balances for add liquidity
  const { balance: bal0Raw, formatted: bal0Fmt } = useTokenBalance(resolvedTokens?.token0)
  const { balance: bal1Raw, formatted: bal1Fmt } = useTokenBalance(resolvedTokens?.token1)

  // Allowances for add liquidity
  const { data: allow0, refetch: refetchAllow0 } = useReadContract({
    address: position?.token0 as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && pmAddress ? [address, pmAddress] : undefined,
    query: { enabled: !!address && !!position && !!pmAddress && !hasWBNB.token0IsWBNB },
  })
  const { data: allow1, refetch: refetchAllow1 } = useReadContract({
    address: position?.token1 as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && pmAddress ? [address, pmAddress] : undefined,
    query: { enabled: !!address && !!position && !!pmAddress && !hasWBNB.token1IsWBNB },
  })

  const fetchPosition = useCallback(async () => {
    if (!pmAddress || !tokenId) {
      setError('Invalid position parameters')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const posData = await viemClient.readContract({
        address: pmAddress,
        abi: POSITION_MANAGER_ABI,
        functionName: 'positions',
        args: [tokenId],
      }) as readonly [bigint, string, string, string, number, number, number, bigint, bigint, bigint, bigint, bigint]

      const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = posData
      const t0Info = resolveTokenInfo(token0)
      const t1Info = resolveTokenInfo(token1)

      let amount0 = 0, amount1 = 0
      try {
        const poolAddr = await viemClient.readContract({
          address: CONTRACTS.Factory as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getPool',
          args: [token0 as `0x${string}`, token1 as `0x${string}`, fee],
        })
        if (poolAddr && poolAddr !== '0x0000000000000000000000000000000000000000') {
          const slot0 = await viemClient.readContract({
            address: poolAddr as `0x${string}`,
            abi: POOL_ABI,
            functionName: 'slot0',
          }) as [bigint, number, number, number, number, number, boolean]
          const amounts = getTokenAmounts(liquidity, slot0[0], Number(slot0[1]), tickLower, tickUpper)
          amount0 = amounts.amount0
          amount1 = amounts.amount1
          // Also set pool price for add liquidity
          const price = sqrtPriceX96ToPrice(slot0[0], t0Info.decimals, t1Info.decimals)
          setPoolPrice(price)
        }
      } catch { /* pool might not exist */ }

      setPosition({
        token0, token1, fee, tickLower, tickUpper, liquidity,
        tokensOwed0: tokensOwed0 as bigint,
        tokensOwed1: tokensOwed1 as bigint,
        token0Symbol: t0Info.symbol, token1Symbol: t1Info.symbol,
        token0Decimals: t0Info.decimals, token1Decimals: t1Info.decimals,
        amount0, amount1,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to load position')
    } finally {
      setLoading(false)
    }
  }, [pmAddress, tokenId])

  useEffect(() => { fetchPosition() }, [fetchPosition])

  // Auto-calculate paired amount for add liquidity
  const autoCalcAdd = useCallback((side: 0 | 1, val: string) => {
    if (!poolPrice || poolPrice <= 0) return
    const num = parseFloat(val)
    if (!num || num <= 0) {
      if (side === 0) setAddAmount1('')
      else setAddAmount0('')
      return
    }
    if (side === 0) {
      // token0 entered → compute token1 = amount0 * price
      const paired = num * poolPrice
      setAddAmount1(paired > 0 ? parseFloat(paired.toPrecision(6)).toString() : '')
    } else {
      const paired = num / poolPrice
      setAddAmount0(paired > 0 ? parseFloat(paired.toPrecision(6)).toString() : '')
    }
  }, [poolPrice])

  const handleAdd0Change = (val: string) => {
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) { setAddAmount0(val); autoCalcAdd(0, val); setAddError('') }
  }
  const handleAdd1Change = (val: string) => {
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) { setAddAmount1(val); autoCalcAdd(1, val); setAddError('') }
  }

  // --- Remove liquidity ---
  const handleRemoveLiquidity = async () => {
    if (!isConnected || !address || !position || !pmAddress || !tokenId) return
    if (position.liquidity === 0n) return

    setRemoveError('')
    setRemoveStatus('removing')

    try {
      const liquidityToRemove = position.liquidity * BigInt(removePercent) / 100n
      const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadline * 60)
      const MAX_UINT128 = 2n ** 128n - 1n

      const calls: `0x${string}`[] = []

      // 1. decreaseLiquidity
      calls.push(encodeFunctionData({
        abi: POSITION_MANAGER_ABI,
        functionName: 'decreaseLiquidity',
        args: [{ tokenId, liquidity: liquidityToRemove, amount0Min: 0n, amount1Min: 0n, deadline: deadlineTs }],
      }))

      if (receiveNative && hasNativeToken) {
        // collect to PM address, then unwrapWETH9 + sweepToken for the other
        calls.push(encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'collect',
          args: [{ tokenId, recipient: pmAddress!, amount0Max: MAX_UINT128, amount1Max: MAX_UINT128 }],
        }))
        // unwrap WBNB → tBNB
        calls.push(encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'unwrapWETH9',
          args: [0n, address],
        }))
        // sweep the non-WBNB token
        const otherToken = hasWBNB.token0IsWBNB ? position.token1 : position.token0
        calls.push(encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'sweepToken',
          args: [otherToken as `0x${string}`, 0n, address],
        }))
      } else {
        // collect directly to user
        calls.push(encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'collect',
          args: [{ tokenId, recipient: address, amount0Max: MAX_UINT128, amount1Max: MAX_UINT128 }],
        }))
      }

      const hash = await writeContractAsync({
        address: pmAddress!,
        abi: POSITION_MANAGER_ABI,
        functionName: 'multicall',
        args: [calls],
      })

      await viemClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
      setRemoveStatus('done')
      await fetchPosition()
    } catch (err: any) {
      console.error('Remove liquidity error:', err)
      setRemoveError(err?.shortMessage || err?.message || 'Transaction failed')
      setRemoveStatus('error')
    }
  }

  // --- Increase liquidity (add to existing position) ---
  const handleIncreaseLiquidity = async () => {
    if (!isConnected || !address || !position || !pmAddress || !tokenId || !addAmount0 || !addAmount1) return

    setAddError('')

    const amt0Raw = parseUnits(addAmount0, position.token0Decimals)
    const amt1Raw = parseUnits(addAmount1, position.token1Decimals)

    const t0IsNative = hasWBNB.token0IsWBNB && addUseNative
    const t1IsNative = hasWBNB.token1IsWBNB && addUseNative

    try {
      // Approve token0 if ERC20
      if (!t0IsNative && amt0Raw > 0n) {
        const cur = (allow0 as bigint) ?? 0n
        if (cur < amt0Raw) {
          setAddStatus('approving0')
          const h = await writeContractAsync({
            address: position.token0 as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [pmAddress!, maxUint256],
          })
          await viemClient.waitForTransactionReceipt({ hash: h, timeout: 60_000 })
          await refetchAllow0()
        }
      }
      // Approve token1 if ERC20
      if (!t1IsNative && amt1Raw > 0n) {
        const cur = (allow1 as bigint) ?? 0n
        if (cur < amt1Raw) {
          setAddStatus('approving1')
          const h = await writeContractAsync({
            address: position.token1 as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [pmAddress!, maxUint256],
          })
          await viemClient.waitForTransactionReceipt({ hash: h, timeout: 60_000 })
          await refetchAllow1()
        }
      }

      setAddStatus('minting')
      const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadline * 60)
      const nativeValue = t0IsNative ? amt0Raw : t1IsNative ? amt1Raw : 0n

      const amt0Min = amt0Raw * 99n / 100n
      const amt1Min = amt1Raw * 99n / 100n

      if (nativeValue > 0n) {
        // Use multicall: increaseLiquidity + refundETH (return excess native)
        const increaseLiqData = encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'increaseLiquidity',
          args: [{
            tokenId: tokenId!,
            amount0Desired: amt0Raw,
            amount1Desired: amt1Raw,
            amount0Min: amt0Min,
            amount1Min: amt1Min,
            deadline: deadlineTs,
          }],
        })
        const refundData = encodeFunctionData({
          abi: POSITION_MANAGER_ABI,
          functionName: 'refundETH',
        })
        await writeContractAsync({
          address: pmAddress!,
          abi: POSITION_MANAGER_ABI,
          functionName: 'multicall',
          args: [[increaseLiqData, refundData]],
          value: nativeValue,
        })
      } else {
        // ERC20 only — direct call
        await writeContractAsync({
          address: pmAddress!,
          abi: POSITION_MANAGER_ABI,
          functionName: 'increaseLiquidity',
          args: [{
            tokenId: tokenId!,
            amount0Desired: amt0Raw,
            amount1Desired: amt1Raw,
            amount0Min: amt0Min,
            amount1Min: amt1Min,
            deadline: deadlineTs,
          }],
        })
      }

      setAddStatus('done')
      setAddAmount0('')
      setAddAmount1('')
      // Auto-reset to idle after 3 seconds so user can add again
      setTimeout(() => setAddStatus('idle'), 3000)
    } catch (err: any) {
      console.error('Add liquidity error:', err)
      setAddError(err?.shortMessage || err?.message || 'Transaction failed')
      setAddStatus('idle')
    }
  }

  // --- Render ---
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
        <div className="w-full max-w-lg text-center py-20">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading position...</p>
        </div>
      </div>
    )
  }

  if (error || !position) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <NavLink to="/pool" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={20} />
            </NavLink>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Position Not Found</h2>
          </div>
          <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--error)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error || 'Position data unavailable'}</p>
          </div>
        </div>
      </div>
    )
  }

  const isActive = position.liquidity > 0n
  const amt0Display = formatAmount(position.amount0, position.token0Decimals)
  const amt1Display = formatAmount(position.amount1, position.token1Decimals)
  const owed0Display = position.tokensOwed0 > 0n
    ? parseFloat(formatUnits(position.tokensOwed0, position.token0Decimals)).toLocaleString('en-US', { maximumFractionDigits: 6 })
    : '0'
  const owed1Display = position.tokensOwed1 > 0n
    ? parseFloat(formatUnits(position.tokensOwed1, position.token1Decimals)).toLocaleString('en-US', { maximumFractionDigits: 6 })
    : '0'

  const removeAmt0 = formatAmount(position.amount0 * removePercent / 100, position.token0Decimals)
  const removeAmt1 = formatAmount(position.amount1 * removePercent / 100, position.token1Decimals)

  // For display: show tBNB label where WBNB is if receiveNative is on
  const display0Symbol = hasWBNB.token0IsWBNB && receiveNative ? 'tBNB' : position.token0Symbol
  const display1Symbol = hasWBNB.token1IsWBNB && receiveNative ? 'tBNB' : position.token1Symbol

  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <NavLink to="/pool" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </NavLink>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex -space-x-2">
              <TokenIcon symbol={position.token0Symbol} size={28} />
              <TokenIcon symbol={position.token1Symbol} size={28} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {position.token0Symbol}/{position.token1Symbol}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {FEE_LABEL[position.fee] ?? `${position.fee / 10000}%`}
            </span>
            {isLegacy && (
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(255,170,0,0.15)', color: '#ffaa00' }}>Legacy</span>
            )}
          </div>
        </div>

        {/* Status + ID */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Position ID: #{tokenId?.toString()}</span>
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: isActive ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
              color: isActive ? 'var(--success)' : 'var(--error)',
            }}
          >
            <Droplets size={12} />
            {isActive ? 'Active' : 'Closed'}
          </div>
        </div>

        {/* Liquidity amounts */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Liquidity</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={position.token0Symbol} size={24} />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{position.token0Symbol}</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{amt0Display}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={position.token1Symbol} size={24} />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{position.token1Symbol}</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{amt1Display}</span>
            </div>
          </div>
        </div>

        {/* Uncollected fees */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Uncollected fees</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={position.token0Symbol} size={18} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{position.token0Symbol}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{owed0Display}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={position.token1Symbol} size={18} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{position.token1Symbol}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{owed1Display}</span>
            </div>
          </div>
        </div>

        {/* Price range */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Price range</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Min tick</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{position.tickLower}</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Max tick</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{position.tickUpper}</div>
            </div>
          </div>
        </div>

        {/* Tab buttons: Add / Remove */}
        {isConnected && isActive && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab(activeTab === 'add' ? 'overview' : 'add')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
                style={{
                  backgroundColor: activeTab === 'add' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: activeTab === 'add' ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <Plus size={16} />
                Increase Liquidity
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'remove' ? 'overview' : 'remove')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
                style={{
                  backgroundColor: activeTab === 'remove' ? '#FF4444' : 'var(--bg-secondary)',
                  color: activeTab === 'remove' ? '#FFFFFF' : 'var(--text-primary)',
                  border: activeTab === 'remove' ? '1px solid #FF4444' : '1px solid var(--border)',
                }}
              >
                <Minus size={16} />
                Remove Liquidity
              </button>
            </div>

            {/* ---- Add liquidity panel ---- */}
            {activeTab === 'add' && (
              <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Add to position</div>

                {/* WBNB ↔ tBNB toggle for add */}
                {hasNativeToken && (
                  <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add as tBNB</span>
                    </div>
                    <button
                      onClick={() => { setAddUseNative(!addUseNative); setAddAmount0(''); setAddAmount1('') }}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: addUseNative ? 'var(--success)' : 'var(--bg-secondary)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                        style={{
                          backgroundColor: 'var(--text-primary)',
                          transform: addUseNative ? 'translateX(22px)' : 'translateX(2px)',
                        }}
                      />
                    </button>
                  </div>
                )}

                {/* Token 0 input */}
                <div className="p-4 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{resolvedTokens?.token0.symbol || position.token0Symbol}</span>
                    {bal0Fmt && (
                      <button
                        onClick={() => {
                          if (!bal0Raw) return
                          const fmt = formatUnits(bal0Raw, position.token0Decimals)
                          const num = parseFloat(fmt)
                          const truncated = Math.floor(num * 1e6) / 1e6
                          const val = truncated > 0 ? truncated.toString() : ''
                          setAddAmount0(val)
                          autoCalcAdd(0, val)
                        }}
                        className="text-xs hover:opacity-80" style={{ color: 'var(--text-secondary)' }}
                      >
                        Balance: {bal0Fmt}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text" inputMode="decimal" placeholder="0" value={addAmount0}
                      onChange={(e) => handleAdd0Change(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-medium outline-none min-w-0"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <TokenIcon symbol={resolvedTokens?.token0.symbol || position.token0Symbol} size={20} />
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{resolvedTokens?.token0.symbol || position.token0Symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Token 1 input */}
                <div className="p-4 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{resolvedTokens?.token1.symbol || position.token1Symbol}</span>
                    {bal1Fmt && (
                      <button
                        onClick={() => {
                          if (!bal1Raw) return
                          const fmt = formatUnits(bal1Raw, position.token1Decimals)
                          const num = parseFloat(fmt)
                          const truncated = Math.floor(num * 1e6) / 1e6
                          const val = truncated > 0 ? truncated.toString() : ''
                          setAddAmount1(val)
                          autoCalcAdd(1, val)
                        }}
                        className="text-xs hover:opacity-80" style={{ color: 'var(--text-secondary)' }}
                      >
                        Balance: {bal1Fmt}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text" inputMode="decimal" placeholder="0" value={addAmount1}
                      onChange={(e) => handleAdd1Change(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-medium outline-none min-w-0"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <TokenIcon symbol={resolvedTokens?.token1.symbol || position.token1Symbol} size={20} />
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{resolvedTokens?.token1.symbol || position.token1Symbol}</span>
                    </div>
                  </div>
                </div>

                {addError && (
                  <div className="mb-3 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: 'rgba(255,68,68,0.1)', color: 'var(--error)' }}>
                    {addError}
                  </div>
                )}

                {addStatus === 'done' ? (
                  <div className="w-full py-3 rounded-2xl font-semibold text-sm text-center" style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: 'var(--success)' }}>
                    ✓ Liquidity Added Successfully
                  </div>
                ) : (
                  <button
                    onClick={handleIncreaseLiquidity}
                    disabled={!addAmount0 || !addAmount1 || addStatus !== 'idle'}
                    className="w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: addAmount0 && addAmount1 && addStatus === 'idle' ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: addAmount0 && addAmount1 && addStatus === 'idle' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      cursor: addAmount0 && addAmount1 && addStatus === 'idle' ? 'pointer' : 'default',
                    }}
                  >
                    {(addStatus === 'approving0' || addStatus === 'approving1' || addStatus === 'minting') && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {addStatus === 'approving0' ? `Approving ${position.token0Symbol}...`
                      : addStatus === 'approving1' ? `Approving ${position.token1Symbol}...`
                      : addStatus === 'minting' ? 'Adding Liquidity...'
                      : 'Add Liquidity'}
                  </button>
                )}
              </div>
            )}

            {/* ---- Remove liquidity panel ---- */}
            {activeTab === 'remove' && (
              <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Remove liquidity</div>

                {/* WBNB ↔ tBNB toggle */}
                {hasNativeToken && (
                  <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Receive as tBNB</span>
                    <button
                      onClick={() => setReceiveNative(!receiveNative)}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: receiveNative ? 'var(--success)' : 'var(--bg-secondary)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                        style={{
                          backgroundColor: 'var(--text-primary)',
                          transform: receiveNative ? 'translateX(22px)' : 'translateX(2px)',
                        }}
                      />
                    </button>
                  </div>
                )}

                {/* Percentage selector */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {REMOVE_PERCENTAGES.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setRemovePercent(pct)}
                      className="py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: removePercent === pct ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: removePercent === pct ? 'var(--bg-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="space-y-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>You will receive</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={display0Symbol} size={18} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{display0Symbol}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{removeAmt0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={display1Symbol} size={18} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{display1Symbol}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{removeAmt1}</span>
                  </div>
                </div>

                {removeError && (
                  <div className="mb-3 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: 'rgba(255,68,68,0.1)', color: 'var(--error)' }}>
                    {removeError}
                  </div>
                )}

                {removeStatus === 'done' ? (
                  <div className="w-full py-3 rounded-2xl font-semibold text-sm text-center" style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: 'var(--success)' }}>
                    ✓ Liquidity Removed Successfully
                  </div>
                ) : (
                  <button
                    onClick={handleRemoveLiquidity}
                    disabled={removeStatus === 'removing'}
                    className="w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: removeStatus === 'removing' ? 'var(--bg-tertiary)' : '#FF4444',
                      color: '#FFFFFF',
                      cursor: removeStatus === 'removing' ? 'default' : 'pointer',
                    }}
                  >
                    {removeStatus === 'removing' && <Loader2 size={16} className="animate-spin" />}
                    {removeStatus === 'removing' ? 'Removing...' : `Remove ${removePercent}% Liquidity`}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Closed position — back to pool */}
        {!isActive && (
          <div className="rounded-2xl p-5 mb-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              This position has been fully closed. All liquidity has been removed.
            </p>
            <NavLink
              to="/pool"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Back to Positions
            </NavLink>
          </div>
        )}
      </div>
    </div>
  )
}
