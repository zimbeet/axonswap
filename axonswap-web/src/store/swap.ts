import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Token } from '@/config'
import { NATIVE_TOKEN, mUSDC } from '@/config'

interface SwapStore {
  tokenIn: Token
  tokenOut: Token
  amountIn: string
  amountOut: string
  slippage: number
  deadline: number       // transaction deadline in minutes
  expertMode: boolean    // skip confirmation modals
  multihop: boolean      // allow multi-hop routing
  autoRouter: boolean    // use auto router for best price
  setTokenIn: (token: Token) => void
  setTokenOut: (token: Token) => void
  setAmountIn: (amount: string) => void
  setAmountOut: (amount: string) => void
  setSlippage: (slippage: number) => void
  setDeadline: (deadline: number) => void
  setExpertMode: (on: boolean) => void
  setMultihop: (on: boolean) => void
  setAutoRouter: (on: boolean) => void
  switchTokens: () => void
}

export const useSwapStore = create<SwapStore>()(
  persist(
    (set) => ({
      tokenIn: NATIVE_TOKEN,
      tokenOut: mUSDC,
      amountIn: '',
      amountOut: '',
      slippage: 0.5,
      deadline: 30,
      expertMode: false,
      multihop: true,
      autoRouter: true,
      setTokenIn: (token) => set({ tokenIn: token }),
      setTokenOut: (token) => set({ tokenOut: token }),
      setAmountIn: (amount) => set({ amountIn: amount }),
      setAmountOut: (amount) => set({ amountOut: amount }),
      setSlippage: (slippage) => set({ slippage }),
      setDeadline: (deadline) => set({ deadline }),
      setExpertMode: (on) => set({ expertMode: on }),
      setMultihop: (on) => set({ multihop: on }),
      setAutoRouter: (on) => set({ autoRouter: on }),
      switchTokens: () =>
        set((state) => ({
          tokenIn: state.tokenOut,
          tokenOut: state.tokenIn,
          amountIn: state.amountOut,
          amountOut: state.amountIn,
        })),
    }),
    {
      name: 'axonswap-settings',
      partialize: (state) => ({
        slippage: state.slippage,
        deadline: state.deadline,
        expertMode: state.expertMode,
        multihop: state.multihop,
        autoRouter: state.autoRouter,
      }),
    }
  )
)
