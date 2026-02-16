"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { parseEther, type Hex } from "viem"
import { MONAD_TESTNET_CHAIN_ID, MONAD_RPC_URL, MONAD_EXPLORER_URL } from "@/lib/constants"

// ==========================================
// MetaMask Wallet Context
// ==========================================

interface PendingTx {
  id: string
  type: "wager" | "transfer" | "resolve" | "game_start"
  fromAgent: string
  toAgent?: string
  gameTokenAmount: number
  tick: number
  memo: string
}

interface WalletState {
  address: string | null
  chainId: number | null
  balance: string | null
  isConnecting: boolean
  isCorrectChain: boolean
  pendingTxs: PendingTx[]
  confirmedHashes: string[]
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchToMonad: () => Promise<void>
  sendTransaction: (tx: PendingTx) => Promise<string | null>
  clearConfirmed: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}

function getEthereum(): (typeof window)["ethereum"] | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { ethereum?: (typeof window)["ethereum"] }).ethereum ?? null
}

const MONAD_CHAIN_HEX = `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}`

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnecting: false,
    isCorrectChain: false,
    pendingTxs: [],
    confirmedHashes: [],
  })

  // Listen for account/chain changes
  useEffect(() => {
    const eth = getEthereum()
    if (!eth) return

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      setState((s) => ({ ...s, address: accounts[0] || null }))
      if (accounts[0]) fetchBalance(accounts[0])
    }
    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string
      const id = parseInt(chainIdHex, 16)
      setState((s) => ({ ...s, chainId: id, isCorrectChain: id === MONAD_TESTNET_CHAIN_ID }))
    }

    eth.on?.("accountsChanged", handleAccountsChanged)
    eth.on?.("chainChanged", handleChainChanged)

    // Check if already connected
    eth.request?.({ method: "eth_accounts" }).then((result) => {
      const accounts = result as string[]
      if (accounts.length > 0) {
        setState((s) => ({ ...s, address: accounts[0] }))
        fetchBalance(accounts[0])
      }
    }).catch(() => {})

    eth.request?.({ method: "eth_chainId" }).then((result) => {
      const chainIdHex = result as string
      const id = parseInt(chainIdHex, 16)
      setState((s) => ({ ...s, chainId: id, isCorrectChain: id === MONAD_TESTNET_CHAIN_ID }))
    }).catch(() => {})

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged)
      eth.removeListener?.("chainChanged", handleChainChanged)
    }
  }, [])

  async function fetchBalance(addr: string) {
    const eth = getEthereum()
    if (!eth) return
    try {
      const bal = (await eth.request?.({ method: "eth_getBalance", params: [addr, "latest"] })) as string | undefined
      if (bal) {
        const wei = BigInt(bal)
        const mon = Number(wei) / 1e18
        setState((s) => ({ ...s, balance: mon.toFixed(4) }))
      }
    } catch { /* ignore */ }
  }

  const connect = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank")
      return
    }
    setState((s) => ({ ...s, isConnecting: true }))
    try {
      const accounts = (await eth.request?.({ method: "eth_requestAccounts" })) as string[]
      if (accounts[0]) {
        setState((s) => ({ ...s, address: accounts[0], isConnecting: false }))
        fetchBalance(accounts[0])
      }
    } catch {
      setState((s) => ({ ...s, isConnecting: false }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, address: null, balance: null, chainId: null, isCorrectChain: false }))
  }, [])

  const switchToMonad = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) return
    try {
      await eth.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_CHAIN_HEX }],
      })
    } catch (err: unknown) {
      // Chain not added yet, add it
      if ((err as { code?: number })?.code === 4902) {
        await eth.request?.({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: MONAD_CHAIN_HEX,
            chainName: "Monad Testnet",
            nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
            rpcUrls: [MONAD_RPC_URL],
            blockExplorerUrls: [MONAD_EXPLORER_URL],
          }],
        })
      }
    }
  }, [])

  const sendTransaction = useCallback(async (tx: PendingTx): Promise<string | null> => {
    const eth = getEthereum()
    if (!eth || !state.address) return null

    // Encode memo as hex calldata
    let hex = "0x"
    const memo = `ARENA|${tx.type}|tick:${tx.tick}|${tx.fromAgent}${tx.toAgent ? "->" + tx.toAgent : ""}|amt:${tx.gameTokenAmount}`
    for (let i = 0; i < memo.length; i++) {
      hex += memo.charCodeAt(i).toString(16).padStart(2, "0")
    }

    const monValue = Math.max(tx.gameTokenAmount * 0.000001, 0.000001)
    const valueHex = `0x${parseEther(monValue.toFixed(18)).toString(16)}`

    try {
      // This triggers MetaMask popup
      const txHash = (await eth.request?.({
        method: "eth_sendTransaction",
        params: [{
          from: state.address,
          to: state.address, // self-transfer as receipt
          value: valueHex,
          data: hex as Hex,
        }],
      })) as string

      setState((s) => ({
        ...s,
        confirmedHashes: [...s.confirmedHashes, txHash],
        pendingTxs: s.pendingTxs.filter((p) => p.id !== tx.id),
      }))

      // Report the confirmed hash to the server
      fetch("/api/chain/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          type: tx.type,
          fromAgent: tx.fromAgent,
          toAgent: tx.toAgent,
          amount: tx.gameTokenAmount,
          tick: tx.tick,
          userWallet: state.address,
        }),
      }).catch(() => {})

      // Refresh balance
      fetchBalance(state.address)

      return txHash
    } catch {
      // User rejected or tx failed
      setState((s) => ({ ...s, pendingTxs: s.pendingTxs.filter((p) => p.id !== tx.id) }))
      return null
    }
  }, [state.address])

  const clearConfirmed = useCallback(() => {
    setState((s) => ({ ...s, confirmedHashes: [] }))
  }, [])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchToMonad, sendTransaction, clearConfirmed }}>
      {children}
    </WalletContext.Provider>
  )
}
