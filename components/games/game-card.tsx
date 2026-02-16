"use client"

import { Swords, Eye, Trophy, Clock, CheckCircle2 } from "lucide-react"
import { GAME_CONFIG } from "@/lib/constants"
import type { Game, Agent } from "@/lib/types"
import { cn } from "@/lib/utils"

const GAME_ICONS: Record<string, React.ReactNode> = {
  swords: <Swords className="h-4 w-4" />,
  eye: <Eye className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
}

interface GameCardProps {
  game: Game
  agents: Record<string, Agent>
}

export function GameCard({ game, agents }: GameCardProps) {
  const config = GAME_CONFIG[game.type]
  const isResolved = game.status === "resolved"
  const playerNames = game.players.map((id) => agents[id]?.persona.name || "Unknown")

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all animate-fade-in",
        isResolved
          ? "bg-card/30 border-border/30"
          : "bg-card/60 border-primary/20 divine-glow"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-primary">{GAME_ICONS[config.icon]}</span>
          <span className="text-xs font-serif font-medium text-foreground">{config.name}</span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded",
            isResolved
              ? "bg-success/15 text-success"
              : game.status === "active"
              ? "bg-gold/15 text-gold animate-pulse-gold"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isResolved ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {game.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{playerNames.join(" vs ")}</span>
        <span className="text-primary/60">|</span>
        <span className="font-mono text-gold">{game.pot} tokens</span>
      </div>

      {isResolved && game.results && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground">{game.results.narrative}</p>
          {game.results.winnerId && (
            <p className="text-xs font-medium text-primary mt-1">
              Winner: {agents[game.results.winnerId]?.persona.name || "Unknown"}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
