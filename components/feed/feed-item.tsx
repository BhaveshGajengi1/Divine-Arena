"use client"

import {
  Swords, ArrowRightLeft, MapPin, Trophy, Skull, Handshake,
  MessageSquare, UserPlus, CircleDot, Eye
} from "lucide-react"
import type { ArenaEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

const EVENT_ICONS: Record<string, React.ReactNode> = {
  agent_decision: <Eye className="h-3.5 w-3.5" />,
  game_start: <Swords className="h-3.5 w-3.5" />,
  game_resolve: <Trophy className="h-3.5 w-3.5" />,
  token_transfer: <ArrowRightLeft className="h-3.5 w-3.5" />,
  zone_move: <MapPin className="h-3.5 w-3.5" />,
  tick_complete: <CircleDot className="h-3.5 w-3.5" />,
  agent_fallen: <Skull className="h-3.5 w-3.5" />,
  alliance_formed: <Handshake className="h-3.5 w-3.5" />,
  alliance_dissolved: <Handshake className="h-3.5 w-3.5" />,
  persuasion_attempt: <MessageSquare className="h-3.5 w-3.5" />,
  human_joined: <UserPlus className="h-3.5 w-3.5" />,
  human_wager: <Swords className="h-3.5 w-3.5" />,
}

const EVENT_COLORS: Record<string, string> = {
  agent_decision: "text-muted-foreground",
  game_start: "text-gold",
  game_resolve: "text-primary",
  token_transfer: "text-celestial",
  zone_move: "text-muted-foreground",
  tick_complete: "text-muted-foreground/50",
  agent_fallen: "text-destructive",
  alliance_formed: "text-success",
  alliance_dissolved: "text-destructive",
  persuasion_attempt: "text-divine-purple",
  human_joined: "text-gold-bright",
  human_wager: "text-gold",
}

interface FeedItemProps {
  event: ArenaEvent
  onViewReasoning?: (agentId: string) => void
}

export function FeedItem({ event, onViewReasoning }: FeedItemProps) {
  const isTickComplete = event.type === "tick_complete"

  if (isTickComplete) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 text-[10px] text-muted-foreground/40 font-mono">
        <div className="flex-1 border-t border-border/20" />
        <span>Tick {event.tick}</span>
        <div className="flex-1 border-t border-border/20" />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 py-1.5 px-2 animate-fade-in group">
      <span className={cn("mt-0.5 shrink-0", EVENT_COLORS[event.type] || "text-muted-foreground")}>
        {EVENT_ICONS[event.type] || <CircleDot className="h-3.5 w-3.5" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/90 leading-relaxed">{event.message}</p>
        {event.amount && event.type !== "tick_complete" && (
          <span className="text-[10px] font-mono text-gold">{event.amount} tokens</span>
        )}
      </div>
      {event.agentId && onViewReasoning && event.type === "agent_decision" && (
        <button
          onClick={() => onViewReasoning(event.agentId!)}
          className="text-[10px] text-primary/60 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          reasoning
        </button>
      )}
    </div>
  )
}
