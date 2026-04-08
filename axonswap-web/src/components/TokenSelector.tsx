import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { DEFAULT_TOKENS, type Token } from '@/config'
import { useTokenBalance } from '@/hooks/useTokenBalance'

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  selectedToken?: Token
}

export function TokenSelector({ isOpen, onClose, onSelect, selectedToken }: TokenSelectorProps) {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filtered = DEFAULT_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-0 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Select a token
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by name or paste address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
        </div>

        {/* Quick select */}
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {DEFAULT_TOKENS.slice(0, 5).map((token) => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token); onClose() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{
                border: '1px solid var(--border)',
                color: selectedToken?.symbol === token.symbol ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: selectedToken?.symbol === token.symbol ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              <TokenIcon symbol={token.symbol} size={20} />
              {token.symbol}
            </button>
          ))}
        </div>

        {/* Token list */}
        <div className="max-h-72 overflow-y-auto px-2 pb-4">
          {filtered.map((token) => (
            <TokenRow
              key={token.symbol}
              token={token}
              isSelected={selectedToken?.symbol === token.symbol}
              onSelect={() => { onSelect(token); onClose() }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No tokens found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TokenRow({ token, isSelected, onSelect }: { token: Token; isSelected: boolean; onSelect: () => void }) {
  const { formatted } = useTokenBalance(token)

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]"
      style={{ color: 'var(--text-primary)' }}
    >
      <TokenIcon symbol={token.symbol} size={36} />
      <div className="text-left">
        <div className="font-medium text-sm">{token.symbol}</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{token.name}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {formatted && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatted}</span>
        )}
        {isSelected && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
        )}
      </div>
    </button>
  )
}

export function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const colors: Record<string, string> = {
    tBNB: '#F0B90B',
    WBNB: '#F0B90B',
    AXON: '#FFFFFF',
    mUSDC: '#2775CA',
    mUSDT: '#26A17B',
    mWBTC: '#F7931A',
    mWETH: '#627EEA',
  }
  const color = colors[symbol] || '#999'

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}22`,
        color: color,
        fontSize: size * 0.35,
        border: `1.5px solid ${color}44`,
      }}
    >
      {symbol.charAt(0)}
    </div>
  )
}
