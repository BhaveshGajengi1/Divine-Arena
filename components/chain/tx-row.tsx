"use client"

import { ExternalLink, Check, Loader2 } from "lucide-react"
import type { TransactionRecord } from "@/lib/types"
import { MONAD_EXPLORER_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"

const TX_TYPE_COLORS: Record<string, string> = {
  wager: "text-gold",
  transfer: "text-celestial",
  resolve: "text-success",
  entry_fee: "text-divine-purple",
  mint: "text-foreground",
}

interface TxRowProps {
  tx: TransactionRecord
  explorerUrl?: string | null
}

export function TxRow({ tx, explorerUrl: propExplorerUrl }: TxRowProps) {
  const isRealTx = tx.txHash.startsWith("0x") && tx.txHash.length === 66
  const truncatedHash = `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}`
  const link = propExplorerUrl || (isRealTx ? `${MONAD_EXPLORER_URL}/tx/${tx.txHash}` : null)

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 text-xs hover:bg-muted/10 transition-colors">
      <span className={cn("font-mono uppercase text-[10px] w-14 shrink-0", TX_TYPE_COLORS[tx.type] || "text-muted-foreground")}>
        {tx.type}
      </span>
      <span className="text-muted-foreground truncate flex-1">
        {tx.fromAgent && tx.toAgent ? `${tx.fromAgent} \u2192 ${tx.toAgent}` : tx.fromAgent || tx.toAgent || "System"}
      </span>
      <span className="font-mono text-gold shrink-0">{tx.amount}</span>
      {isRealTx ? (
        <span className="flex items-center gap-0.5 shrink-0">
          <Check className="h-3 w-3 text-success" />
        </span>
      ) : (
        <span className="flex items-center gap-0.5 shrink-0">
          <Loader2 className="h-3 w-3 text-muted-foreground/40 animate-spin" />
        </span>
      )}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-primary/70 hover:text-primary shrink-0 transition-colors"
        >
          {truncatedHash}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="font-mono text-muted-foreground/40 shrink-0">{truncatedHash}</span>
      )}
    </div>
  )
}
