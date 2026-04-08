import { DEFAULT_TOKENS } from '@/config'
import { TokenIcon } from '@/components/TokenSelector'

export function TokensPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Tokens</h2>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Token</div>
            <div className="text-xs font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Decimals</div>
            <div className="text-xs font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Network</div>
            <div className="text-xs font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Address</div>
          </div>

          {/* Token rows */}
          {DEFAULT_TOKENS.map((token) => (
            <div
              key={token.symbol}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} size={32} />
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{token.symbol}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{token.name}</div>
                </div>
              </div>
              <div className="text-sm text-right self-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                {token.decimals}
              </div>
              <div className="text-sm text-right self-center" style={{ color: 'var(--text-secondary)' }}>
                BSC Testnet
              </div>
              <div className="text-xs text-right self-center font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                {token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
                  ? 'Native'
                  : `${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
              </div>
            </div>
          ))}
        </div>

        {/* Faucet info */}
        <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Get test tokens
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            To get tBNB for gas, visit the{' '}
            <a
              href="https://www.bnbchain.org/en/testnet-faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--text-primary)' }}
            >
              BNB Testnet Faucet
            </a>
            . Mock tokens (mUSDC, mUSDT, mWBTC, mWETH) have a public faucet function — call{' '}
            <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              faucet()
            </code>{' '}
            to mint test tokens to your wallet.
          </p>
        </div>
      </div>
    </div>
  )
}
