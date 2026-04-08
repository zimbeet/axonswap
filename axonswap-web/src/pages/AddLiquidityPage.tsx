import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ChevronDown, Info, Loader2, Wallet, ArrowLeftRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits, formatUnits, maxUint256, createPublicClient, http } from 'viem'
import { DEFAULT_TOKENS, FEE_TIERS, CONTRACTS, NATIVE_TOKEN, WBNB, type Token } from '@/config'
import { TokenSelector, TokenIcon } from '@/components/TokenSelector'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { ERC20_ABI, POSITION_MANAGER_ABI, FACTORY_ABI, POOL_ABI } from '@/abi'
import { useSwapStore } from '@/store/swap'
import { bscTestnet } from '@/config/chains'

const viemClient = createPublicClient({ chain: bscTestnet, transport: http() })

const FEE_LABELS: Record<number, { label: string; desc: string }> = {
  [FEE_TIERS.LOWEST]: { label: '0.01%', desc: 'Best for very stable pairs' },
  [FEE_TIERS.LOW]: { label: '0.05%', desc: 'Best for stable pairs' },
  [FEE_TIERS.MEDIUM]: { label: '0.30%', desc: 'Best for most pairs' },
  [FEE_TIERS.HIGH]: { label: '1.00%', desc: 'Best for exotic pairs' },
}

/**
 * Convert sqrtPriceX96 to a human-readable price of sorted_token1 per sorted_token0.
 * price = (sqrtPriceX96 / 2^96)^2 * 10^(dec0 - dec1)
 */
function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, dec0: number, dec1: number): number {
  const sqrtP = Number(sqrtPriceX96) / 2 ** 96
  const rawPrice = sqrtP * sqrtP
  return rawPrice * 10 ** (dec0 - dec1)
}

export function AddLiquidityPage() {
  const { address, isConnected } = useAccount()
  const { deadline } = useSwapStore()
  const [token0, setToken0] = useState<Token>(DEFAULT_TOKENS[0])
  const [token1, setToken1] = useState<Token | null>(null)
  const [feeTier, setFeeTier] = useState<number>(FEE_TIERS.MEDIUM)
  const [selectorFor, setSelectorFor] = useState<0 | 1 | null>(null)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [status, setStatus] = useState<'idle' | 'approving0' | 'approving1' | 'minting' | 'done'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [poolPrice, setPoolPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  // Track which input the user edited last so we auto-fill the other
  const lastEditedRef = useRef<0 | 1>(0)

  const { balance: balance0Raw, formatted: balance0 } = useTokenBalance(token0)
  const { balance: balance1Raw, formatted: balance1 } = useTokenBalance(token1)

  // Sort tokens by address for V3 (token0 < token1)
  const sortedTokens = useMemo(() => {
    if (!token1) return null
    const t0addr = token0.address === NATIVE_TOKEN.address ? CONTRACTS.WBNB : token0.address
    const t1addr = token1.address === NATIVE_TOKEN.address ? CONTRACTS.WBNB : token1.address
    if (t0addr.toLowerCase() < t1addr.toLowerCase()) {
      return { sorted0: { ...token0, address: t0addr }, sorted1: { ...token1, address: t1addr }, reversed: false }
    }
    return { sorted0: { ...token1, address: t1addr }, sorted1: { ...token0, address: t0addr }, reversed: true }
  }, [token0, token1])

  // Check if pool exists
  const { data: poolAddress } = useReadContract({
    address: CONTRACTS.Factory as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPool',
    args: sortedTokens ? [
      sortedTokens.sorted0.address as `0x${string}`,
      sortedTokens.sorted1.address as `0x${string}`,
      feeTier,
    ] : undefined,
    query: { enabled: !!sortedTokens },
  })

  const poolExists = poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000'

  // Fetch pool price when pool exists
  useEffect(() => {
    if (!poolExists || !poolAddress || !sortedTokens) {
      setPoolPrice(null)
      return
    }
    let cancelled = false
    setPriceLoading(true)
    viemClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: POOL_ABI,
      functionName: 'slot0',
    }).then((result) => {
      if (cancelled) return
      const [sqrtPriceX96] = result as [bigint, number, number, number, number, number, boolean]
      const price = sqrtPriceX96ToPrice(sqrtPriceX96, sortedTokens.sorted0.decimals, sortedTokens.sorted1.decimals)
      setPoolPrice(price)
    }).catch(() => {
      if (!cancelled) setPoolPrice(null)
    }).finally(() => {
      if (!cancelled) setPriceLoading(false)
    })
    return () => { cancelled = true }
  }, [poolExists, poolAddress, sortedTokens])

  // Auto-calculate paired amount based on pool price
  const autoCalcPairedAmount = useCallback((editedSide: 0 | 1, value: string) => {
    if (!poolPrice || poolPrice <= 0 || !sortedTokens) return

    const num = parseFloat(value)
    if (!num || num <= 0) {
      if (editedSide === 0) setAmount1('')
      else setAmount0('')
      return
    }

    // poolPrice = sorted_token1 per sorted_token0
    if (editedSide === 0) {
      let paired: number
      if (!sortedTokens.reversed) {
        // UI token0 = sorted0, UI token1 = sorted1
        paired = num * poolPrice
      } else {
        // UI token0 = sorted1, UI token1 = sorted0
        paired = num / poolPrice
      }
      setAmount1(paired > 0 ? parseFloat(paired.toPrecision(6)).toString() : '')
    } else {
      let paired: number
      if (!sortedTokens.reversed) {
        // UI token1 = sorted1, UI token0 = sorted0
        paired = num / poolPrice
      } else {
        // UI token1 = sorted0, UI token0 = sorted1
        paired = num * poolPrice
      }
      setAmount0(paired > 0 ? parseFloat(paired.toPrecision(6)).toString() : '')
    }
  }, [poolPrice, sortedTokens])

  // Check allowances
  const { data: allowance0, refetch: refetchAllowance0 } = useReadContract({
    address: sortedTokens?.sorted0.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.NonfungiblePositionManager as `0x${string}`] : undefined,
    query: { enabled: !!address && !!sortedTokens },
  })

  const { data: allowance1, refetch: refetchAllowance1 } = useReadContract({
    address: sortedTokens?.sorted1.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.NonfungiblePositionManager as `0x${string}`] : undefined,
    query: { enabled: !!address && !!sortedTokens },
  })

  const { writeContractAsync } = useWriteContract()

  // Helper: check if a token is WBNB or tBNB (native)
  const isWBNBOrNative = (t: Token | null) =>
    t !== null && (t.address === NATIVE_TOKEN.address || t.address.toLowerCase() === CONTRACTS.WBNB.toLowerCase())

  // Toggle WBNB ↔ tBNB for token0 or token1
  const toggleNativeWrapped = (side: 0 | 1) => {
    const current = side === 0 ? token0 : token1
    if (!current) return
    const isNative = current.address === NATIVE_TOKEN.address
    const newToken = isNative ? WBNB : NATIVE_TOKEN
    // Don't allow both sides to be the same underlying token
    const other = side === 0 ? token1 : token0
    if (other && isWBNBOrNative(other)) return
    if (side === 0) setToken0(newToken)
    else setToken1(newToken)
    setAmount0('')
    setAmount1('')
    setPoolPrice(null)
  }

  const handleSelectToken = (token: Token) => {
    if (selectorFor === 0) setToken0(token)
    else if (selectorFor === 1) setToken1(token)
    setSelectorFor(null)
    setAmount0('')
    setAmount1('')
    setPoolPrice(null)
  }

  const handleAmount0Change = (val: string) => {
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setAmount0(val)
      lastEditedRef.current = 0
      autoCalcPairedAmount(0, val)
    }
  }

  const handleAmount1Change = (val: string) => {
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setAmount1(val)
      lastEditedRef.current = 1
      autoCalcPairedAmount(1, val)
    }
  }

  const handleMaxBalance0 = useCallback(() => {
    if (!balance0Raw || !isConnected) return
    const isNative = token0.address === NATIVE_TOKEN.address
    let formatted: string
    if (isNative) {
      const safe = balance0Raw > parseUnits('0.01', 18) ? balance0Raw - parseUnits('0.01', 18) : 0n
      formatted = formatUnits(safe, token0.decimals)
    } else {
      formatted = formatUnits(balance0Raw, token0.decimals)
    }
    const val = parseFloat(parseFloat(formatted).toFixed(6)).toString()
    setAmount0(val)
    lastEditedRef.current = 0
    autoCalcPairedAmount(0, val)
  }, [balance0Raw, isConnected, token0, autoCalcPairedAmount])

  const handleMaxBalance1 = useCallback(() => {
    if (!balance1Raw || !isConnected || !token1) return
    const isNative = token1.address === NATIVE_TOKEN.address
    let formatted: string
    if (isNative) {
      const safe = balance1Raw > parseUnits('0.01', 18) ? balance1Raw - parseUnits('0.01', 18) : 0n
      formatted = formatUnits(safe, token1.decimals)
    } else {
      formatted = formatUnits(balance1Raw, token1.decimals)
    }
    const val = parseFloat(parseFloat(formatted).toFixed(6)).toString()
    setAmount1(val)
    lastEditedRef.current = 1
    autoCalcPairedAmount(1, val)
  }, [balance1Raw, isConnected, token1, autoCalcPairedAmount])

  const handleAddLiquidity = async () => {
    if (!isConnected || !address || !token1 || !sortedTokens || !amount0 || !amount1) return
    setErrorMsg('')

    const amt0Raw = parseUnits(
      sortedTokens.reversed ? amount1 : amount0,
      sortedTokens.sorted0.decimals
    )
    const amt1Raw = parseUnits(
      sortedTokens.reversed ? amount0 : amount1,
      sortedTokens.sorted1.decimals
    )

    const sorted0IsNative = token0.address === NATIVE_TOKEN.address
      ? !sortedTokens.reversed
      : token1.address === NATIVE_TOKEN.address
      ? sortedTokens.reversed
      : false
    const sorted1IsNative = token0.address === NATIVE_TOKEN.address
      ? sortedTokens.reversed
      : token1.address === NATIVE_TOKEN.address
      ? !sortedTokens.reversed
      : false

    try {
      if (!sorted0IsNative && amt0Raw > 0n) {
        const currentAllowance = (allowance0 as bigint) ?? 0n
        if (currentAllowance < amt0Raw) {
          setStatus('approving0')
          const hash = await writeContractAsync({
            address: sortedTokens.sorted0.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.NonfungiblePositionManager as `0x${string}`, maxUint256],
          })
          await viemClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
          await refetchAllowance0()
        }
      }

      if (!sorted1IsNative && amt1Raw > 0n) {
        const currentAllowance = (allowance1 as bigint) ?? 0n
        if (currentAllowance < amt1Raw) {
          setStatus('approving1')
          const hash = await writeContractAsync({
            address: sortedTokens.sorted1.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.NonfungiblePositionManager as `0x${string}`, maxUint256],
          })
          await viemClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
          await refetchAllowance1()
        }
      }

      setStatus('minting')
      const tickSpacing = feeTier === 100 ? 1 : feeTier === 500 ? 10 : feeTier === 3000 ? 60 : 200
      const MIN_TICK = Math.ceil(-887272 / tickSpacing) * tickSpacing
      const MAX_TICK = Math.floor(887272 / tickSpacing) * tickSpacing
      const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadline * 60)
      const nativeValue = sorted0IsNative ? amt0Raw : sorted1IsNative ? amt1Raw : 0n

      // 1% slippage tolerance
      const amt0Min = amt0Raw * 99n / 100n
      const amt1Min = amt1Raw * 99n / 100n

      await writeContractAsync({
        address: CONTRACTS.NonfungiblePositionManager as `0x${string}`,
        abi: POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [{
          token0: sortedTokens.sorted0.address as `0x${string}`,
          token1: sortedTokens.sorted1.address as `0x${string}`,
          fee: feeTier,
          tickLower: MIN_TICK,
          tickUpper: MAX_TICK,
          amount0Desired: amt0Raw,
          amount1Desired: amt1Raw,
          amount0Min: amt0Min,
          amount1Min: amt1Min,
          recipient: address,
          deadline: deadlineTs,
        }],
        value: nativeValue,
      })

      setStatus('done')
      setAmount0('')
      setAmount1('')
    } catch (err: any) {
      console.error('Add liquidity error:', err)
      setErrorMsg(err?.shortMessage || err?.message || 'Transaction failed')
      setStatus('idle')
    }
  }

  // Display price in user-facing token order
  const displayPrice = useMemo(() => {
    if (!poolPrice || !sortedTokens || !token1) return null
    if (!sortedTokens.reversed) {
      return { base: token0.symbol, quote: token1.symbol, value: poolPrice }
    } else {
      return { base: token0.symbol, quote: token1.symbol, value: 1 / poolPrice }
    }
  }, [poolPrice, sortedTokens, token0, token1])

  const buttonDisabled = !isConnected || !token1 || !amount0 || !amount1 || (status !== 'idle' && status !== 'done')
  const buttonText = !isConnected
    ? 'Connect Wallet'
    : !token1
    ? 'Select a token pair'
    : !amount0 || !amount1
    ? 'Enter amounts'
    : !poolExists
    ? 'Pool does not exist'
    : status === 'approving0'
    ? `Approving ${sortedTokens?.sorted0.symbol}...`
    : status === 'approving1'
    ? `Approving ${sortedTokens?.sorted1.symbol}...`
    : status === 'minting'
    ? 'Adding Liquidity...'
    : status === 'done'
    ? '✓ Liquidity Added!'
    : 'Add Liquidity'

  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <NavLink to="/pool" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </NavLink>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Liquidity</h2>
        </div>

        {/* Step 1: Select pair */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Select pair
          </div>
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <button
                onClick={() => setSelectorFor(0)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <TokenIcon symbol={token0.symbol} size={24} />
                <span className="font-medium">{token0.symbol}</span>
                <ChevronDown size={16} className="ml-auto" style={{ color: 'var(--text-secondary)' }} />
              </button>
              {isWBNBOrNative(token0) && !isWBNBOrNative(token1) && (
                <button
                  onClick={() => toggleNativeWrapped(0)}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeftRight size={10} />
                  {token0.address === NATIVE_TOKEN.address ? 'Use WBNB' : 'Use tBNB'}
                </button>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <button
                onClick={() => setSelectorFor(1)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors w-full"
                style={{
                  backgroundColor: token1 ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: token1 ? 'var(--text-primary)' : 'var(--bg-primary)',
                }}
              >
                {token1 ? (
                  <>
                    <TokenIcon symbol={token1.symbol} size={24} />
                    <span className="font-medium">{token1.symbol}</span>
                    <ChevronDown size={16} className="ml-auto" style={{ color: 'var(--text-secondary)' }} />
                  </>
                ) : (
                  <span className="font-medium">Select token</span>
                )}
              </button>
              {token1 && isWBNBOrNative(token1) && !isWBNBOrNative(token0) && (
                <button
                  onClick={() => toggleNativeWrapped(1)}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeftRight size={10} />
                  {token1.address === NATIVE_TOKEN.address ? 'Use WBNB' : 'Use tBNB'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Fee tier */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Fee tier
            <Info size={14} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(FEE_LABELS).map(([fee, { label, desc }]) => (
              <button
                key={fee}
                onClick={() => setFeeTier(Number(fee))}
                className="p-3 rounded-xl text-center transition-all"
                style={{
                  backgroundColor: feeTier === Number(fee) ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: feeTier === Number(fee) ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: feeTier === Number(fee) ? '1px solid var(--accent)' : '1px solid transparent',
                }}
              >
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-[10px] mt-1 opacity-70">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current price display */}
        {displayPrice && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)',
          }}>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Current price</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                1 {displayPrice.base} = {parseFloat(displayPrice.value.toPrecision(6))} {displayPrice.quote}
              </span>
            </div>
          </div>
        )}
        {priceLoading && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
          }}>
            <Loader2 size={14} className="animate-spin" />
            Fetching pool price...
          </div>
        )}

        {/* Step 3: Deposit amounts */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Deposit amounts
          </div>

          {/* Token 0 input */}
          <div className="p-4 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{token0.symbol}</span>
              {isConnected && balance0 && (
                <button
                  onClick={handleMaxBalance0}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Wallet size={12} />
                  <span>{balance0}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount0}
                onChange={(e) => handleAmount0Change(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-medium outline-none min-w-0"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TokenIcon symbol={token0.symbol} size={20} />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{token0.symbol}</span>
              </div>
            </div>
          </div>

          {/* Token 1 input */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{token1?.symbol || 'Token'}</span>
              {isConnected && balance1 && (
                <button
                  onClick={handleMaxBalance1}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Wallet size={12} />
                  <span>{balance1}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount1}
                onChange={(e) => handleAmount1Change(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-medium outline-none min-w-0"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {token1 ? (
                  <>
                    <TokenIcon symbol={token1.symbol} size={20} />
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{token1.symbol}</span>
                  </>
                ) : (
                  <span className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Select</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pool status */}
        {token1 && sortedTokens && (
          <div className="mb-3 px-4 py-2 rounded-xl text-xs" style={{
            backgroundColor: poolExists ? 'var(--bg-secondary)' : 'rgba(255,68,68,0.1)',
            color: poolExists ? 'var(--text-secondary)' : 'var(--error)',
            border: poolExists ? '1px solid var(--border)' : '1px solid var(--error)',
          }}>
            {poolExists
              ? `✓ Pool exists: ${sortedTokens.sorted0.symbol}/${sortedTokens.sorted1.symbol} (${FEE_LABELS[feeTier]?.label})`
              : `✗ No pool found for this pair at ${FEE_LABELS[feeTier]?.label} fee tier`
            }
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-3 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: 'rgba(255,68,68,0.1)', color: 'var(--error)', border: '1px solid var(--error)' }}>
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAddLiquidity}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: !buttonDisabled && poolExists ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: !buttonDisabled && poolExists ? 'var(--bg-primary)' : 'var(--text-secondary)',
            cursor: !buttonDisabled && poolExists ? 'pointer' : 'default',
          }}
          disabled={buttonDisabled || !poolExists}
        >
          {(status === 'approving0' || status === 'approving1' || status === 'minting') && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {buttonText}
        </button>
      </div>

      <TokenSelector
        isOpen={selectorFor !== null}
        onClose={() => setSelectorFor(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorFor === 0 ? token0 : token1 ?? undefined}
      />
    </div>
  )
}
