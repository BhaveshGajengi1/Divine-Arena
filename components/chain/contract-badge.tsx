"use client"

import { Copy, ExternalLink, Check } from "lucide-react"
import { useState, useCallback } from "react"
import { MONAD_EXPLORER_URL } from "@/lib/constants"

interface ContractBadgeProps {
  label: string
  address: string
}

export function ContractBadge({ label, address }: ContractBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [address])

  const truncated = `${address.slice(0, 10)}...${address.slice(-8)}`
  const explorerUrl = `${MONAD_EXPLORER_URL}/address/${address}`

  return (
    <div className="flex items-center gap-2 bg-card/40 border border-border/30 rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-mono text-foreground truncate">{truncated}</p>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
        title="Copy address"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
        title="View on explorer"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
