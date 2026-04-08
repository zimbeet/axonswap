import { NavLink } from 'react-router-dom'
import { Sun, Moon, Wallet } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  const { isDark, toggle } = useThemeStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            <img src="/axon-logo.svg" alt="AxonSwap" className="w-8 h-8" style={{ filter: isDark ? 'invert(1)' : 'none' }} />
            AxonSwap
          </NavLink>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/swap', label: 'Swap' },
              { to: '/pool', label: 'Pool' },
              { to: '/tokens', label: 'Tokens' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-tertiary)]'
                      : 'hover:bg-[var(--bg-secondary)]'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain
              return (
                <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const, userSelect: 'none' as const } })}>
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--bg-primary)',
                          }}
                        >
                          <Wallet size={16} />
                          Connect Wallet
                        </button>
                      )
                    }
                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} className="px-4 py-2.5 rounded-xl font-medium text-sm bg-[var(--error)] text-white">
                          Wrong Network
                        </button>
                      )
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--bg-secondary)]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {chain.name}
                        </button>
                        <button
                          onClick={openAccountModal}
                          className="px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {account.displayName}
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
