import { useState, useEffect, useCallback } from 'react'
import { ArrowDown, Settings, ChevronDown, Loader2, AlertTriangle, Wallet, CheckCircle2 } from 'lucide-react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits, formatUnits, maxUint256, createPublicClient, http, encodeFunctionData } from 'viem'
import { useSwapStore } from '@/store/swap'
import { TokenSelector, TokenIcon } from '@/components/TokenSelector'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useQuote } from '@/hooks/useQuote'
import { CONTRACTS, NATIVE_TOKEN, type Token } from '@/config'
import { bscTestnet } from '@/config/chains'
import { ERC20_ABI, SWAP_ROUTER_ABI, WETH_ABI } from '@/abi'

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-10 h-5 rounded-full transition-colors"
      style={{ backgroundColor: on ? 'var(--success)' : 'var(--bg-tertiary)' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
        style={{
          backgroundColor: 'var(--text-primary)',
          transform: on ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}

function resolveAddress(token: Token): `0x${string}` {
  if (token.address === NATIVE_TOKEN.address) return CONTRACTS.WBNB as `0x${string}`
  return token.address as `0x${string}`
}

const viemClient = createPublicClient({ chain: bscTestnet, transport: http() })

export function SwapPage() {
  const { address, isConnected } = useAccount()
  const {
    tokenIn, tokenOut, amountIn, amountOut,
    setTokenIn, setTokenOut, setAmountIn, setAmountOut,
    switchTokens, slippage, setSlippage,
    deadline, setDeadline,
    expertMode, setExpertMode,
    multihop, setMultihop,
    autoRouter, setAutoRouter,
  } = useSwapStore()

  const [selectorOpen, setSelectorOpen] = useState<'in' | 'out' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [swapStatus, setSwapStatus] = useState<'idle' | 'approving' | 'swapping' | 'done'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Clear error when tokens or amount change
  useEffect(() => {
    setErrorMsg('')
  }, [tokenIn, tokenOut, amountIn])

  const { balance: balanceInRaw, formatted: balanceIn } = useTokenBalance(tokenIn)
  const { formatted: balanceOut } = useTokenBalance(tokenOut)

  const isNativeIn = tokenIn.address === NATIVE_TOKEN.address
  const isNativeOut = tokenOut.address === NATIVE_TOKEN.address
  const tokenInAddr = resolveAddress(tokenIn)
  const tokenOutAddr = resolveAddress(tokenOut)

  // Detect WBNB ↔ tBNB wrap/unwrap (no pool needed)
  const isWrapMode = isNativeIn && tokenOut.address.toLowerCase() === CONTRACTS.WBNB.toLowerCase()
  const isUnwrapMode = isNativeOut && tokenIn.address.toLowerCase() === CONTRACTS.WBNB.toLowerCase()
  const isWrapUnwrap = isWrapMode || isUnwrapMode

  // Get quote (skip for wrap/unwrap)
  const { quote, loading: isQuoting, error: quoteError } = useQuote(
    tokenIn, tokenOut, isWrapUnwrap ? '' : amountIn, true
  )

  // Update amountOut when quote changes (only for non-wrap/unwrap)
  useEffect(() => {
    if (isWrapUnwrap) return
    if (quote) {
      const num = parseFloat(quote.amountOut)
      setAmountOut(num > 0 ? parseFloat(num.toFixed(6)).toString() : '')
    } else if (!isQuoting) {
      setAmountOut('')
    }
  }, [quote, isQuoting, setAmountOut, isWrapUnwrap])

  // For wrap/unwrap, output = input (1:1)
  useEffect(() => {
    if (isWrapUnwrap) {
      setAmountOut(amountIn && parseFloat(amountIn) > 0 ? amountIn : '')
    }
  }, [isWrapUnwrap, amountIn, setAmountOut])

  // Check approval for tokenIn (only ERC20)
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: tokenInAddr,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.SwapRouter as `0x${string}`] : undefined,
    query: { enabled: !!address && !isNativeIn },
  })

  const { writeContractAsync } = useWriteContract()

  const handleSelectToken = (token: Token) => {
    if (selectorOpen === 'in') {
      if (token.symbol === tokenOut.symbol) switchTokens()
      else setTokenIn(token)
    } else {
      if (token.symbol === tokenIn.symbol) switchTokens()
      else setTokenOut(token)
    }
    setSelectorOpen(null)
  }

  const handleMaxBalance = useCallback(() => {
    if (!balanceInRaw || !isConnected) return
    const formatted = formatUnits(balanceInRaw, tokenIn.decimals)
    if (isNativeIn) {
      const num = parseFloat(formatted)
      const safe = Math.max(0, num - 0.01) // leave 0.01 tBNB for gas
      setAmountIn(safe > 0 ? parseFloat(safe.toFixed(6)).toString() : '')
    } else {
      // Truncate (floor) to 6 decimals to avoid rounding up beyond actual balance
      const num = parseFloat(formatted)
      const truncated = Math.floor(num * 1e6) / 1e6
      setAmountIn(truncated > 0 ? truncated.toString() : '')
    }
  }, [balanceInRaw, tokenIn.decimals, isNativeIn, isConnected, setAmountIn])

  const handleSwap = async () => {
    if (!isConnected || !address || !amountIn) return
    setErrorMsg('')

    try {
      const amountInRaw = parseUnits(amountIn, tokenIn.decimals)

      // ---- Wrap/Unwrap mode (WBNB ↔ tBNB, 1:1) ----
      if (isWrapUnwrap) {
        setSwapStatus('swapping')
        const wbnbAddr = CONTRACTS.WBNB as `0x${string}`

        // Cap amount at actual balance to avoid precision issues
        let actualAmount = amountInRaw
        if (balanceInRaw !== undefined && actualAmount > balanceInRaw) {
          actualAmount = balanceInRaw
        }

        let hash: `0x${string}`
        if (isWrapMode) {
          // tBNB → WBNB: call WBNB.deposit{value: amount}()
          hash = await writeContractAsync({
            address: wbnbAddr,
            abi: WETH_ABI,
            functionName: 'deposit',
            args: [],
            value: actualAmount,
          })
        } else {
          // WBNB → tBNB: call WBNB.withdraw(amount)
          hash = await writeContractAsync({
            address: wbnbAddr,
            abi: WETH_ABI,
            functionName: 'withdraw',
            args: [actualAmount],
          })
        }

        await viemClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
        setSwapStatus('done')
        setTimeout(() => {
          setSwapStatus('idle')
          setAmountIn('')
          setAmountOut('')
        }, 3000)
        return
      }

      // ---- Normal swap mode ----
      if (!quote) return
      const fee = quote.fee

      // Check and do approval if needed (ERC20 only)
      if (!isNativeIn) {
        const currentAllowance = (allowanceData as bigint) ?? 0n
        if (currentAllowance < amountInRaw) {
          setSwapStatus('approving')
          const approveHash = await writeContractAsync({
            address: tokenInAddr,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.SwapRouter as `0x${string}`, maxUint256],
          })
          await viemClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 })
          await refetchAllowance()
        }
      }

      // Execute swap
      setSwapStatus('swapping')
      const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadline * 60)

      // Calculate minimum output with slippage
      const minOut = quote.amountOutRaw * BigInt(Math.floor((100 - slippage) * 100)) / 10000n

      const routerAddr = CONTRACTS.SwapRouter as `0x${string}`

      let swapHash: `0x${string}`

      if (isNativeOut) {
        // When output is native (tBNB), use multicall:
        // 1. exactInputSingle with recipient=router (to hold WBNB)
        // 2. unwrapWETH9 to convert WBNB→BNB and send to user
        const swapCalldata = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            fee,
            recipient: routerAddr, // send WBNB to router first
            deadline: deadlineTs,
            amountIn: amountInRaw,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          }],
        })
        const unwrapCalldata = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: 'unwrapWETH9',
          args: [minOut, address],
        })
        swapHash = await writeContractAsync({
          address: routerAddr,
          abi: SWAP_ROUTER_ABI,
          functionName: 'multicall',
          args: [[swapCalldata, unwrapCalldata]],
          value: isNativeIn ? amountInRaw : 0n,
        })
      } else {
        // Normal ERC20→ERC20 or Native→ERC20 swap
        swapHash = await writeContractAsync({
          address: routerAddr,
          abi: SWAP_ROUTER_ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            fee,
            recipient: address,
            deadline: deadlineTs,
            amountIn: amountInRaw,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          }],
          value: isNativeIn ? amountInRaw : 0n,
        })
      }

      await viemClient.waitForTransactionReceipt({ hash: swapHash, timeout: 60_000 })
      setSwapStatus('done')

      // Reset after 3 seconds
      setTimeout(() => {
        setSwapStatus('idle')
        setAmountIn('')
        setAmountOut('')
      }, 3000)
    } catch (err: any) {
      console.error('Swap error:', err)
      setErrorMsg(err?.shortMessage || err?.message || 'Swap failed')
      setSwapStatus('idle')
    }
  }

  // Compute rate string
  const rateStr = isWrapUnwrap
    ? `1 ${tokenIn.symbol} = 1 ${tokenOut.symbol}`
    : quote && amountIn && parseFloat(amountIn) > 0
    ? `1 ${tokenIn.symbol} ≈ ${parseFloat((parseFloat(quote.amountOut) / parseFloat(amountIn)).toFixed(6))} ${tokenOut.symbol}`
    : null

  // Fee tier label
  const feePct = quote ? (quote.fee / 10000).toFixed(2) + '%' : null

  const highSlippage = slippage > 5

  // Button state — allow tiny rounding tolerance (1000 wei) for wrap/unwrap
  let insufficientBalance = false
  try {
    if (balanceInRaw !== undefined && !!amountIn && parseFloat(amountIn) > 0) {
      const required = parseUnits(amountIn, tokenIn.decimals)
      if (isWrapUnwrap) {
        // Allow small rounding gap for wrap/unwrap since we cap at actual balance
        insufficientBalance = required > balanceInRaw + 1000n
      } else {
        insufficientBalance = required > balanceInRaw
      }
    }
  } catch { /* invalid parse */ }
  const hasAmount = !!amountIn && parseFloat(amountIn) > 0
  const canSwap = isConnected && hasAmount && !insufficientBalance && swapStatus === 'idle' && (isWrapUnwrap || !!quote)

  const buttonText =
    !isConnected ? 'Connect Wallet'
    : !hasAmount ? 'Enter an amount'
    : insufficientBalance ? `Insufficient ${tokenIn.symbol} balance`
    : swapStatus === 'approving' ? `Approving ${tokenIn.symbol}...`
    : swapStatus === 'swapping' ? (isWrapMode ? 'Wrapping...' : isUnwrapMode ? 'Unwrapping...' : 'Swapping...')
    : swapStatus === 'done' ? (isWrapMode ? '✓ Wrapped!' : isUnwrapMode ? '✓ Unwrapped!' : '✓ Swap Successful!')
    : isWrapUnwrap ? (isWrapMode ? 'Wrap' : 'Unwrap')
    : isQuoting ? 'Fetching quote...'
    : quoteError ? quoteError
    : !quote ? 'No route found'
    : 'Swap'

  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Swap</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: showSettings ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Enhanced Settings Panel */}
        {showSettings && (
          <div className="mb-3 p-4 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {/* Slippage */}
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                Slippage Tolerance
                {highSlippage && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--error)' }}>
                    <AlertTriangle size={12} /> High slippage
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSlippage(v)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: slippage === v ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: slippage === v ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {v}%
                  </button>
                ))}
                <div
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: highSlippage ? '1px solid var(--error)' : '1px solid transparent',
                  }}
                >
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(Number(e.target.value))}
                    className="w-12 bg-transparent text-sm outline-none text-right"
                    style={{ color: 'var(--text-primary)' }}
                    step={0.1}
                    min={0.01}
                    max={50}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>%</span>
                </div>
              </div>
            </div>

            {/* Transaction Deadline */}
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Transaction Deadline
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <input
                    type="number"
                    value={deadline}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(180, Number(e.target.value)))
                      setDeadline(v)
                    }}
                    className="w-12 bg-transparent text-sm outline-none text-right"
                    style={{ color: 'var(--text-primary)' }}
                    min={1}
                    max={180}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>minutes</span>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--border)' }} />

            {/* Auto Router */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Auto Router</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Use the AxonSwap router for best price
                </div>
              </div>
              <ToggleSwitch on={autoRouter} onChange={setAutoRouter} />
            </div>

            {/* Multihop */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Multihop</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Allow routing through multiple pools
                </div>
              </div>
              <ToggleSwitch on={multihop} onChange={setMultihop} />
            </div>

            {/* Expert Mode */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Expert Mode</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Skip confirmation prompts and allow high slippage
                </div>
              </div>
              <ToggleSwitch on={expertMode} onChange={setExpertMode} />
            </div>
          </div>
        )}

        {/* Swap Card */}
        <div className="rounded-2xl p-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {/* Input Token */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>You pay</span>
              {isConnected && balanceIn && (
                <button
                  onClick={handleMaxBalance}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Click to use max"
                >
                  <Wallet size={12} />
                  <span>{balanceIn}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amountIn}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                    setAmountIn(val)
                  }
                }}
                className="flex-1 bg-transparent text-3xl font-medium outline-none min-w-0"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => setSelectorOpen('in')}
                className="flex items-center gap-2 px-3 py-2 rounded-full shrink-0 transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <TokenIcon symbol={tokenIn.symbol} size={24} />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tokenIn.symbol}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Switch button */}
          <div className="flex items-center justify-center -my-3 relative z-10">
            <button
              onClick={switchTokens}
              className="p-2 rounded-xl transition-all hover:rotate-180 duration-300"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '3px solid var(--bg-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              <ArrowDown size={16} />
            </button>
          </div>

          {/* Output Token */}
          <div className="p-4 rounded-xl mt-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>You receive</span>
              {isConnected && balanceOut && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Wallet size={12} />
                  <span>{balanceOut}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-3xl font-medium min-w-0" style={{ color: amountOut ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {isQuoting ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  amountOut || '0'
                )}
              </div>
              <button
                onClick={() => setSelectorOpen('out')}
                className="flex items-center gap-2 px-3 py-2 rounded-full shrink-0 transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <TokenIcon symbol={tokenOut.symbol} size={24} />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tokenOut.symbol}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 px-4 py-2 rounded-xl text-xs" style={{
            backgroundColor: 'rgba(255,68,68,0.1)',
            color: 'var(--error)',
            border: '1px solid var(--error)',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="w-full mt-3 py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: canSwap ? 'var(--accent)' : swapStatus === 'done' ? 'var(--success)' : 'var(--bg-tertiary)',
            color: canSwap ? 'var(--bg-primary)' : swapStatus === 'done' ? '#fff' : 'var(--text-secondary)',
            cursor: canSwap ? 'pointer' : 'default',
          }}
          disabled={!canSwap}
        >
          {(swapStatus === 'approving' || swapStatus === 'swapping') && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {swapStatus === 'done' && <CheckCircle2 size={18} />}
          {buttonText}
        </button>

        {/* Rate info */}
        {rateStr && (
          <div className="mt-3 p-3 rounded-xl text-sm space-y-1.5" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Rate</span>
              <span>{rateStr}</span>
            </div>
            {feePct && (
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>Fee tier</span>
                <span>{feePct}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Slippage</span>
              <span>{slippage}%</span>
            </div>
            {quote && (
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>Min. received</span>
                <span>
                  {parseFloat(formatUnits(
                    quote.amountOutRaw * BigInt(Math.floor((100 - slippage) * 100)) / 10000n,
                    tokenOut.decimals
                  )).toFixed(6)} {tokenOut.symbol}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Token Selector Modal */}
      <TokenSelector
        isOpen={selectorOpen !== null}
        onClose={() => setSelectorOpen(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorOpen === 'in' ? tokenIn : tokenOut}
      />
    </div>
  )
}
