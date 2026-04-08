import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: true,
      toggle: () =>
        set((state) => {
          const next = !state.isDark
          if (next) {
            document.documentElement.classList.remove('light')
          } else {
            document.documentElement.classList.add('light')
          }
          return { isDark: next }
        }),
    }),
    {
      name: 'axonswap-theme',
      onRehydrateStorage: () => (state) => {
        if (state && !state.isDark) {
          document.documentElement.classList.add('light')
        }
      },
    }
  )
)
