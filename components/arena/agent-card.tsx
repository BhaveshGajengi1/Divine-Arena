"use client"

import { Flame, Shield, Swords, Wind, Eye, Crown, User, Skull } from "lucide-react"
import type { Agent } from "@/lib/types"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ReactNode> = {
  flame: <Flame className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  sword: <Swords className="h-4 w-4" />,
  wind: <Wind className="h-4 w-4" />,
  eye: <Eye className="h-4 w-4" />,
  crown: <Crown className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
}

interface AgentCardProps {
  agent: Agent
  compact?: boolean
  onClick?: () => void
}

export function AgentCard({ agent, compact, onClick }: AgentCardProps) {
  const isFallen = agent.status === "fallen"

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border text-left w-full transition-all",
        "hover:divine-glow cursor-pointer",
        isFallen
          ? "bg-card/30 border-destructive/30 opacity-60"
          : "bg-card/60 border-border/50 hover:border-primary/40",
        agent.isHuman && "border-primary/50 divine-border"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex items-center justify-center h-9 w-9 rounded-full shrink-0",
          isFallen ? "bg-destructive/20 text-destructive" : "text-primary-foreground"
        )}
        style={{ backgroundColor: isFallen ? undefined : agent.persona.color + "33" }}
      >
        {isFallen ? <Skull className="h-4 w-4" /> : ICON_MAP[agent.persona.icon] || <User className="h-4 w-4" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-serif text-sm font-semibold truncate", isFallen && "line-through text-muted-foreground")}>
            {agent.persona.name}
          </span>
          {agent.isHuman && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              Human
            </span>
          )}
          {isFallen && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
              Fallen
            </span>
          )}
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{agent.persona.title}</p>
        )}
      </div>

      {/* Balance */}
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-mono font-medium", isFallen ? "text-muted-foreground" : "text-gold")}>
          {agent.balance}
        </p>
        {!compact && (
          <p className="text-[10px] text-muted-foreground">
            {agent.wins}W / {agent.losses}L
          </p>
        )}
      </div>
    </button>
  )
}
