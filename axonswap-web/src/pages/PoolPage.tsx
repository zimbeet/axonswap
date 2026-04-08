import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Plus, Loader2, Droplets, ChevronRight } from 'lucide-react'
import { useAccount } from 'wagmi'
import { NavLink } from 'react-router-dom'
import { createPublicClient, http, formatUnits } from 'viem'
import { CONTRACTS, LEGACY_POSITION_MANAGERS } from '@/config'
import { DEFAULT_TOKENS } from '@/config/tokens'
import { bscTestnet } from '@/config/chains'
import { POSITION_MANAGER_ABI, FACTORY_ABI, POOL_ABI } from '@/abi'
import { TokenIcon } from '@/components/TokenSelector'

const viemClient = createPublicClient({ chain: bscTestnet, transport: http() })

const FEE_LABEL: Record<number, string> = {
  100: '0.01%',
  500: '0.05%',
  3000: '0.30%',
  10000: '1.00%',
}

interface Position {
  tokenId: bigint
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  token0Symbol: string
  token1Symbol: string
  token0Decimals: number
  token1Decimals: number
  managerAddress: string
  amount0Display: string
  amount1Display: string
  tokensOwed0: bigint
  tokensOwed1: bigint
}

function resolveTokenInfo(address: string): { symbol: string; decimals: number } {
  const lower = address.toLowerCase()
  for (const t of DEFAULT_TOKENS) {
    if (t.address.toLowerCase() === lower) return { symbol: t.symbol, decimals: t.decimals }
  }
  if (lower === CONTRACTS.WBNB.toLowerCase()) return { symbol: 'WBNB', decimals: 18 }
  return { symbol: address.slice(0, 6) + '...' + address.slice(-4), decimals: 18 }
}

/** Compute token amounts from liquidity, current price, and tick range */
function getTokenAmounts(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  currentTick: number,
  tickLower: number,
  tickUpper: number,
): { amount0: number; amount1: number } {
  const sqrtPriceCurrent = Number(sqrtPriceX96) / 2 ** 96
  const sqrtPriceLower = Math.sqrt(1.0001 ** tickLower)
  const sqrtPriceUpper = Math.sqrt(1.0001 ** tickUpper)
  const liq = Number(liquidity)

  if (liq === 0) return { amount0: 0, amount1: 0 }

  if (currentTick < tickLower) {
    return {
      amount0: liq * (1 / sqrtPriceLower - 1 / sqrtPriceUpper),
      amount1: 0,
    }
  } else if (currentTick >= tickUpper) {
    return {
      amount0: 0,
      amount1: liq * (sqrtPriceUpper - sqrtPriceLower),
    }
  } else {
    return {
      amount0: liq * (1 / sqrtPriceCurrent - 1 / sqrtPriceUpper),
      amount1: liq * (sqrtPriceCurrent - sqrtPriceLower),
    }
  }
}

function formatAmount(raw: number, decimals: number): string {
  const val = raw / 10 ** decimals
  if (val === 0) return '0'
  if (val < 0.000001) return '<0.000001'
  if (val >= 1_000_000_000) return Math.floor(val).toLocaleString('en-US')
  if (val >= 1) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
  return parseFloat(val.toPrecision(6)).toString()
}

const poolSlot0Cache = new Map<string, { sqrtPriceX96: bigint; tick: number } | null>()

async function getPoolSlot0(token0: string, token1: string, fee: number) {
  const key = `${token0}-${token1}-${fee}`.toLowerCase()
  if (poolSlot0Cache.has(key)) return poolSlot0Cache.get(key)!
  try {
    const poolAddr = await viemClient.readContract({
      address: CONTRACTS.Factory as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getPool',
      args: [token0 as `0x${string}`, token1 as `0x${string}`, fee],
    })
    if (!poolAddr || poolAddr === '0x0000000000000000000000000000000000000000') {
      poolSlot0Cache.set(key, null)
      return null
    }
    const slot0 = await viemClient.readContract({
      address: poolAddr as `0x${string}`,
      abi: POOL_ABI,
      functionName: 'slot0',
    }) as [bigint, number, number, number, number, number, boolean]
    const data = { sqrtPriceX96: slot0[0], tick: Number(slot0[1]) }
    poolSlot0Cache.set(key, data)
    return data
  } catch {
    poolSlot0Cache.set(key, null)
    return null
  }
}

async function fetchPositions(userAddress: string): Promise<Position[]> {
  const allManagers = [
    CONTRACTS.NonfungiblePositionManager,
    ...LEGACY_POSITION_MANAGERS,
  ]
  const positions: Position[] = []

  for (const mgr of allManagers) {
    const mgrAddr = mgr as `0x${string}`
    try {
      const balance = await viemClient.readContract({
        address: mgrAddr,
        abi: POSITION_MANAGER_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      }) as bigint

      for (let i = 0n; i < balance; i++) {
        try {
          const tokenId = await viemClient.readContract({
            address: mgrAddr,
            abi: POSITION_MANAGER_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [userAddress as `0x${string}`, i],
          }) as bigint

          const posData = await viemClient.readContract({
            address: mgrAddr,
            abi: POSITION_MANAGER_ABI,
            functionName: 'positions',
            args: [tokenId],
          }) as readonly [bigint, string, string, string, number, number, number, bigint, bigint, bigint, bigint, bigint]

          const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = posData
          const t0Info = resolveTokenInfo(token0)
          const t1Info = resolveTokenInfo(token1)

          // Fetch pool slot0 to compute amounts
          let amount0Display = '—'
          let amount1Display = '—'
          const slot0 = await getPoolSlot0(token0, token1, fee)
          if (slot0) {
            const amounts = getTokenAmounts(liquidity, slot0.sqrtPriceX96, slot0.tick, tickLower, tickUpper)
            amount0Display = formatAmount(amounts.amount0, t0Info.decimals)
            amount1Display = formatAmount(amounts.amount1, t1Info.decimals)
          }

          positions.push({
            tokenId,
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            liquidity,
            token0Symbol: t0Info.symbol,
            token1Symbol: t1Info.symbol,
            token0Decimals: t0Info.decimals,
            token1Decimals: t1Info.decimals,
            managerAddress: mgr,
            amount0Display,
            amount1Display,
            tokensOwed0: tokensOwed0 as bigint,
            tokensOwed1: tokensOwed1 as bigint,
          })
        } catch {
          // Skip individual position read errors
        }
      }
    } catch {
      // Skip manager read errors
    }
  }

  return positions
}

export function PoolPage() {
  const { address, isConnected } = useAccount()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)

  const loadPositions = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const pos = await fetchPositions(address)
      // Filter out fully closed positions (liquidity = 0)
      setPositions(pos.filter(p => p.liquidity > 0n))
    } catch (err) {
      console.error('Failed to load positions:', err)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      loadPositions()
    } else {
      setPositions([])
    }
  }, [isConnected, address, loadPositions])

  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Positions</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Provide liquidity to earn fees
            </p>
          </div>
          <NavLink
            to="/pool/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <Plus size={16} />
            New Position
          </NavLink>
        </div>

        {/* Positions list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {!isConnected ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <ExternalLink size={24} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Connect your wallet
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Connect a wallet to view your liquidity positions
              </p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Plus size={24} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No positions found
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Open a new position to start earning fees
              </p>
              <NavLink
                to="/pool/add"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                <Plus size={16} />
                New Position
              </NavLink>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {positions.map((pos) => (
                <PositionCard key={`${pos.managerAddress}-${pos.tokenId.toString()}`} position={pos} />
              ))}
            </div>
          )}
        </div>

        {/* Learn section */}
        <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Learn about providing liquidity
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Concentrated liquidity allows you to provide liquidity within custom price ranges.
            You'll earn trading fees proportional to your share of the pool within the active range.
            Positions that are out of range won't earn fees until the price re-enters your range.
          </p>
        </div>
      </div>
    </div>
  )
}

function PositionCard({ position }: { position: Position }) {
  const isActive = position.liquidity > 0n
  const isLegacy = position.managerAddress !== CONTRACTS.NonfungiblePositionManager
  const detailUrl = `/pool/position?pm=${encodeURIComponent(position.managerAddress)}&id=${position.tokenId.toString()}`

  return (
    <NavLink
      to={detailUrl}
      className="block p-4 transition-colors hover:bg-[var(--bg-secondary)] cursor-pointer"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Token pair icons */}
          <div className="flex -space-x-2">
            <TokenIcon symbol={position.token0Symbol} size={28} />
            <TokenIcon symbol={position.token1Symbol} size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {position.token0Symbol}/{position.token1Symbol}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {FEE_LABEL[position.fee] ?? `${position.fee / 10000}%`}
              </span>
              {isLegacy && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'rgba(255,170,0,0.15)', color: '#ffaa00' }}
                >
                  Legacy
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              ID: #{position.tokenId.toString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: isActive ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
              color: isActive ? 'var(--success)' : 'var(--error)',
            }}
          >
            <Droplets size={12} />
            {isActive ? 'Active' : 'Closed'}
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Token amounts */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <TokenIcon symbol={position.token0Symbol} size={16} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {position.amount0Display}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{position.token0Symbol}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <TokenIcon symbol={position.token1Symbol} size={16} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {position.amount1Display}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{position.token1Symbol}</span>
        </div>
      </div>
    </NavLink>
  )
}
