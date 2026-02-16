"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { TxRow } from "./tx-row"
import type { TransactionRecord } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExternalLink, Wallet } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface VerificationPanelProps {
  transactions: TransactionRecord[]
  totalWagered?: number
  totalTransactions?: number
  contractBalance?: number
}

export function VerificationPanel({
  transactions,
}: VerificationPanelProps) {
  const { data: chainData } = useSWR("/api/chain", fetcher, { refreshInterval: 5000 })

  const serverWallet = chainData?.serverWallet || null
  const walletBalance = chainData?.walletBalance || "0"
  const explorerUrl = chainData?.explorerUrl || "https://monad-testnet.socialscan.io"
  const walletExplorerUrl = chainData?.walletExplorerUrl || null
  const totalWagered = chainData?.totalWagered ?? 0
  const totalTxs = chainData?.totalTransactions ?? 0

  // Merge transactions from props + API (API has explorer URLs)
  const enrichedTxs: (TransactionRecord & { explorerUrl?: string | null })[] =
    chainData?.recentTransactions || transactions

  return (
    <div className="flex flex-col gap-4">
      {/* Network + Wallet info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card/40 border border-border/30 rounded-lg p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Network</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success live-dot" />
            <span className="text-sm font-mono text-foreground">Monad Testnet</span>
            <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">Chain 10143</span>
          </div>
        </div>
        <div className="bg-card/40 border border-border/30 rounded-lg p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Server Wallet</p>
          {serverWallet ? (
            <div className="flex items-center gap-2">
              <Wallet className="h-3 w-3 text-gold" />
              <a
                href={walletExplorerUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary hover:underline truncate max-w-[180px]"
              >
                {serverWallet.slice(0, 6)}...{serverWallet.slice(-4)}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="text-[10px] font-mono text-gold ml-auto">{Number(walletBalance).toFixed(4)} MON</span>
            </div>
          ) : (
            <p className="text-xs font-mono text-destructive">No wallet configured</p>
          )}
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/40 border border-border/30 rounded-lg p-3 text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Wagered</p>
          <p className="text-lg font-mono font-semibold text-gold mt-1">{totalWagered.toLocaleString()}</p>
        </div>
        <div className="bg-card/40 border border-border/30 rounded-lg p-3 text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">On-chain Txns</p>
          <p className="text-lg font-mono font-semibold text-foreground mt-1">{totalTxs}</p>
        </div>
        <div className="bg-card/40 border border-border/30 rounded-lg p-3 text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Explorer</p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline mt-2"
          >
            View All <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Transaction log */}
      <div className="bg-card/30 border border-border/30 rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border/20">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Recent Transactions ({enrichedTxs.length})
          </h4>
        </div>
        <ScrollArea className="max-h-[280px]">
          {enrichedTxs.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic text-center py-8">
              No on-chain transactions yet. Run a tick in live mode to see real transactions.
            </p>
          ) : (
            enrichedTxs.map((tx) => (
              <TxRow key={tx.txHash} tx={tx} explorerUrl={(tx as { explorerUrl?: string }).explorerUrl} />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
