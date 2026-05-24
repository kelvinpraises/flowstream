import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCircleWallet } from '#/hooks/useCircleWallet.ts'
import { mockWallet, type WalletState } from '#/data/mock.ts'
import { type Address } from 'viem'

/* ─── Context shape ─── */

interface WalletContextValue {
  // Circle wallet (real)
  address: Address | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  usdcBalance: bigint
  register: (username: string) => Promise<void>
  login: () => Promise<void>
  disconnect: () => void
  sendUserOperation: (calls: unknown[]) => Promise<string>
  // Legacy mock wallet (for components that still consume WalletState)
  legacyWallet: WalletState
}

const WalletContext = createContext<WalletContextValue | null>(null)

/* ─── Provider ─── */

export function WalletProvider({ children }: { children: ReactNode }) {
  const circle = useCircleWallet()

  // Bridge Circle wallet state into the legacy WalletState format so
  // existing components (BalanceBar, etc.) keep working without changes.
  const legacyWallet: WalletState = useMemo(() => ({
    address: circle.address
      ? `${circle.address.slice(0, 6)}...${circle.address.slice(-4)}`
      : mockWallet.address,
    usdcBalance: circle.isConnected
      ? Number(circle.usdcBalance) / 1e6  // ERC-20 USDC is 6 decimals
      : mockWallet.usdcBalance,
    connected: circle.isConnected,
    sessionKeySigned: circle.isConnected,  // passkey IS the session
  }), [circle.address, circle.isConnected, circle.usdcBalance])

  const value: WalletContextValue = useMemo(() => ({
    address: circle.address,
    isConnected: circle.isConnected,
    isLoading: circle.isLoading,
    error: circle.error,
    usdcBalance: circle.usdcBalance,
    register: circle.register,
    login: circle.login,
    disconnect: circle.disconnect,
    sendUserOperation: circle.sendUserOperation,
    legacyWallet,
  }), [circle, legacyWallet])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

/* ─── Consumer hook ─── */

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWalletContext must be used within <WalletProvider>')
  return ctx
}
