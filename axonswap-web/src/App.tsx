import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { wagmiConfig } from '@/config/wagmi'
import { useThemeStore } from '@/store/theme'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SwapPage } from '@/pages/SwapPage'
import { PoolPage } from '@/pages/PoolPage'
import { AddLiquidityPage } from '@/pages/AddLiquidityPage'
import { TokensPage } from '@/pages/TokensPage'
import { PositionDetailPage } from '@/pages/PositionDetailPage'

const queryClient = new QueryClient()

function AppContent() {
  const { isDark } = useThemeStore()

  return (
    <RainbowKitProvider
      theme={isDark
        ? darkTheme({
            accentColor: '#FFFFFF',
            accentColorForeground: '#0D0D0D',
            borderRadius: 'large',
            fontStack: 'system',
          })
        : lightTheme({
            accentColor: '#0D0D0D',
            accentColorForeground: '#FFFFFF',
            borderRadius: 'large',
            fontStack: 'system',
          })
      }
    >
      <BrowserRouter>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/swap" replace />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/pool" element={<PoolPage />} />
            <Route path="/pool/add" element={<AddLiquidityPage />} />
            <Route path="/pool/position" element={<PositionDetailPage />} />
            <Route path="/tokens" element={<TokensPage />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </RainbowKitProvider>
  )
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
