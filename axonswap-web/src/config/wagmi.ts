import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet } from './chains'
import {
  metaMaskWallet,
  okxWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'

export const wagmiConfig = getDefaultConfig({
  appName: 'AxonSwap',
  projectId: 'axonswap-dev-local', // WalletConnect project ID — replace for production
  chains: [bscTestnet],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        okxWallet,
        walletConnectWallet,
        coinbaseWallet,
        trustWallet,
        injectedWallet,
      ],
    },
  ],
  ssr: false,
})
