import { useState, useCallback, useEffect, useRef } from 'react'
import {
  toPasskeyTransport,
  toModularTransport,
  toWebAuthnCredential,
  toCircleSmartAccount,
  WebAuthnMode,
} from '@circle-fin/modular-wallets-core'
import { createPublicClient, type Address, erc20Abi, defineChain } from 'viem'
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction'

/* ─── Arc Testnet chain definition ─── */

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

/* ─── Constants ─── */

const USDC_ARC: Address = '0x3600000000000000000000000000000000000000'
const CREDENTIAL_STORAGE_KEY = 'flowstream_circle_credential'

const clientKey = import.meta.env.VITE_CIRCLE_CLIENT_KEY as string
const clientUrl = import.meta.env.VITE_CIRCLE_CLIENT_URL as string

/* ─── Types ─── */

interface StoredCredential {
  id: string
  publicKey: `0x${string}`
}

export interface CircleWalletState {
  address: Address | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  usdcBalance: bigint
  register: (username: string) => Promise<void>
  login: () => Promise<void>
  disconnect: () => void
  sendUserOperation: (calls: unknown[]) => Promise<string>
}

/* ─── Helpers ─── */

function storeCredential(credential: { id: string; publicKey: `0x${string}` }) {
  try {
    const data: StoredCredential = { id: credential.id, publicKey: credential.publicKey }
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable — silent fail
  }
}

function loadStoredCredential(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(CREDENTIAL_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredCredential
  } catch {
    return null
  }
}

function clearStoredCredential() {
  try {
    localStorage.removeItem(CREDENTIAL_STORAGE_KEY)
  } catch {
    // silent
  }
}

/* ─── Hook ─── */

export function useCircleWallet(): CircleWalletState {
  const [address, setAddress] = useState<Address | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n)

  // Refs to hold SDK objects without triggering re-renders
  const bundlerClientRef = useRef<ReturnType<typeof createBundlerClient> | null>(null)
  const publicClientRef = useRef<ReturnType<typeof createPublicClient> | null>(null)
  const balanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Build transports + clients from credential ── */

  const initializeFromCredential = useCallback(async (credential: { id: string; publicKey: `0x${string}` }) => {
    const modularTransport = toModularTransport(
      `${clientUrl}/arcTestnet`,
      clientKey,
    )

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: modularTransport,
    })
    publicClientRef.current = publicClient

    const owner = toWebAuthnAccount({ credential })

    const smartAccount = await toCircleSmartAccount({
      client: publicClient,
      owner,
    })

    const bundlerClient = createBundlerClient({
      account: smartAccount,
      chain: arcTestnet,
      transport: modularTransport,
      paymaster: true,
    })
    bundlerClientRef.current = bundlerClient

    const accountAddress = smartAccount.address
    setAddress(accountAddress)
    setIsConnected(true)
    setError(null)

    // Fetch balance immediately
    fetchBalance(publicClient, accountAddress)

    // Poll balance every 15s
    if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current)
    balanceIntervalRef.current = setInterval(() => {
      fetchBalance(publicClient, accountAddress)
    }, 15_000)

    return accountAddress
  }, [])

  /* ── Fetch USDC ERC-20 balance ── */

  const fetchBalance = useCallback(async (client: ReturnType<typeof createPublicClient>, addr: Address) => {
    try {
      const balance = await client.readContract({
        address: USDC_ARC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      })
      setUsdcBalance(balance)
    } catch {
      // Balance read failed — keep previous value
    }
  }, [])

  /* ── Auto-restore from localStorage on mount ── */

  useEffect(() => {
    const stored = loadStoredCredential()
    if (stored) {
      setIsLoading(true)
      initializeFromCredential(stored)
        .catch(() => {
          // Stored credential is invalid — clear it
          clearStoredCredential()
        })
        .finally(() => setIsLoading(false))
    }

    return () => {
      if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current)
    }
  }, [initializeFromCredential])

  /* ── Register: create new passkey + MSCA ── */

  const register = useCallback(async (username: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const passkeyTransport = toPasskeyTransport(clientUrl, clientKey)

      const credential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Register,
        username,
      })

      storeCredential(credential)
      await initializeFromCredential(credential)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      if (message.includes('InvalidStateError')) {
        setError('A passkey already exists for this account. Try logging in instead.')
      } else if (message.includes('NotAllowedError') || message.includes('cancelled')) {
        setError('Passkey creation was cancelled.')
      } else {
        setError(message)
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [initializeFromCredential])

  /* ── Login: restore existing passkey ── */

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const passkeyTransport = toPasskeyTransport(clientUrl, clientKey)

      const credential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Login,
      })

      storeCredential(credential)
      await initializeFromCredential(credential)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      if (message.includes('NotAllowedError') || message.includes('cancelled')) {
        setError('Passkey selection was cancelled.')
      } else {
        setError(message)
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [initializeFromCredential])

  /* ── Disconnect ── */

  const disconnect = useCallback(() => {
    clearStoredCredential()
    setAddress(null)
    setIsConnected(false)
    setUsdcBalance(0n)
    setError(null)
    bundlerClientRef.current = null
    publicClientRef.current = null
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current)
      balanceIntervalRef.current = null
    }
  }, [])

  /* ── Send user operation (gasless) ── */

  const sendUserOperation = useCallback(async (calls: unknown[]): Promise<string> => {
    const bundler = bundlerClientRef.current
    if (!bundler) throw new Error('Wallet not connected')

    const userOpHash = await bundler.sendUserOperation({
      calls: calls as never,
      paymaster: true,
    })

    const { receipt } = await bundler.waitForUserOperationReceipt({
      hash: userOpHash,
    })

    // Refresh balance after tx
    if (publicClientRef.current && address) {
      fetchBalance(publicClientRef.current, address)
    }

    return receipt.transactionHash
  }, [address, fetchBalance])

  return {
    address,
    isConnected,
    isLoading,
    error,
    usdcBalance,
    register,
    login,
    disconnect,
    sendUserOperation,
  }
}
