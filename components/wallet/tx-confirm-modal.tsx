"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from "@/lib/wallet/wallet-context"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, ExternalLink, Wallet } from "lucide-react"
import { MONAD_EXPLORER_URL } from "@/lib/constants"

interface PendingTx {
  id: string
  type: "wager" | "transfer" | "resolve" | "game_start"
  fromAgent: string
  toAgent?: string
  gameTokenAmount: number
  tick: number
  memo: string
}

interface TxConfirmModalProps {
  pendingTxs: PendingTx[]
  onTxConfirmed: (txId: string, txHash: string) => void
  onTxRejected: (txId: string) => void
}

export function TxConfirmModal({ pendingTxs, onTxConfirmed, onTxRejected }: TxConfirmModalProps) {
  const { address, isCorrectChain, sendTransaction, connect, switchToMonad } = useWallet()
  const [processing, setProcessing] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { hash: string | null; status: "success" | "failed" }>>({})

  const handleConfirm = useCallback(async (tx: PendingTx) => {
    if (!address || !isCorrectChain) return
    setProcessing(tx.id)
    const hash = await sendTransaction(tx)
    if (hash) {
      setResults((r) => ({ ...r, [tx.id]: { hash, status: "success" } }))
      onTxConfirmed(tx.id, hash)
    } else {
      setResults((r) => ({ ...r, [tx.id]: { hash: null, status: "failed" } }))
      onTxRejected(tx.id)
    }
    setProcessing(null)
  }, [address, isCorrectChain, sendTransaction, onTxConfirmed, onTxRejected])

  // Auto-clear old results after 5s
  useEffect(() => {
    const keys = Object.keys(results)
    if (keys.length === 0) return
    const timer = setTimeout(() => setResults({}), 5000)
    return () => clearTimeout(timer)
  }, [results])

  if (pendingTxs.length === 0 && Object.keys(results).length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-20 right-4 z-50 w-80 max-h-[400px] overflow-y-auto bg-card border border-border/60 rounded-xl shadow-2xl"
      >
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-mono font-semibold text-foreground">Pending Transactions</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
            {pendingTxs.length} queued
          </span>
        </div>

        <div className="p-3 space-y-2">
          {/* Not connected */}
          {!address && pendingTxs.length > 0 && (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-muted-foreground">Connect your wallet to confirm transactions</p>
              <Button size="sm" onClick={connect} className="gap-2">
                <Wallet className="h-3.5 w-3.5" /> Connect MetaMask
              </Button>
            </div>
          )}

          {/* Wrong chain */}
          {address && !isCorrectChain && pendingTxs.length > 0 && (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-destructive">Switch to Monad Testnet to sign</p>
              <Button size="sm" variant="outline" onClick={switchToMonad}>Switch Network</Button>
            </div>
          )}

          {/* Pending transactions */}
          {address && isCorrectChain && pendingTxs.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-muted/20 border border-border/30 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-gold">{tx.type}</span>
                <span className="text-[10px] font-mono text-muted-foreground">Tick {tx.tick}</span>
              </div>
              <p className="text-xs text-foreground">
                {tx.fromAgent}{tx.toAgent ? ` \u2192 ${tx.toAgent}` : ""} &middot; <span className="text-gold font-mono">{tx.gameTokenAmount} tokens</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60">{(tx.gameTokenAmount * 0.000001).toFixed(6)} MON gas</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  disabled={processing === tx.id}
                  onClick={() => handleConfirm(tx)}
                >
                  {processing === tx.id ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Confirming...</>
                  ) : (
                    <><Check className="h-3 w-3" /> Confirm in MetaMask</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => onTxRejected(tx.id)}
                  disabled={processing === tx.id}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Confirmed results */}
          {Object.entries(results).map(([id, result]) => (
            <motion.div
              key={`result-${id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`border rounded-lg p-3 ${result.status === "success" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}
            >
              {result.status === "success" && result.hash ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-success font-mono">Confirmed</p>
                    <a
                      href={`${MONAD_EXPLORER_URL}/tx/${result.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      {result.hash.slice(0, 14)}...{result.hash.slice(-6)}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-destructive">Transaction rejected</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
