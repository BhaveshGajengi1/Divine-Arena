"use client"

import { useWallet } from "@/lib/wallet/wallet-context"
import { Button } from "@/components/ui/button"
import { Wallet, ChevronDown, ExternalLink, LogOut, AlertTriangle } from "lucide-react"
import { MONAD_EXPLORER_URL } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ConnectWalletButton() {
  const { address, balance, isConnecting, isCorrectChain, connect, disconnect, switchToMonad } = useWallet()

  if (!address) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={connect}
        disabled={isConnecting}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-mono text-xs"
      >
        <Wallet className="h-3.5 w-3.5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  if (!isCorrectChain) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={switchToMonad}
        className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 font-mono text-xs"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Switch to Monad
      </Button>
    )
  }

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-success/30 text-foreground hover:bg-success/5 font-mono text-xs"
        >
          <span className="h-2 w-2 rounded-full bg-success live-dot" />
          {shortAddr}
          {balance && <span className="text-gold ml-1">{balance} MON</span>}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-card border-border/50">
        <DropdownMenuItem asChild>
          <a
            href={`${MONAD_EXPLORER_URL}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
