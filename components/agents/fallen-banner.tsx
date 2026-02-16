"use client"

import { Skull } from "lucide-react"
import type { Agent } from "@/lib/types"

interface FallenBannerProps {
  agent: Agent
}

export function FallenBanner({ agent }: FallenBannerProps) {
  return (
    <div className="relative p-4 rounded-lg border border-destructive/30 bg-card/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3 relative">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/15 border border-destructive/30">
          <Skull className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <p className="font-serif text-sm text-destructive/80 line-through">{agent.persona.name}</p>
          <p className="text-[10px] text-muted-foreground">
            Peak: {agent.peakBalance} tokens | {agent.totalGamesPlayed} games played
          </p>
        </div>
      </div>
    </div>
  )
}
