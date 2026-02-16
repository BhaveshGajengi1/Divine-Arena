"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DecisionLog } from "./decision-log"
import type { Agent } from "@/lib/types"
import { Flame, Shield, Swords, Wind, Eye, Crown, User } from "lucide-react"

const ICON_MAP: Record<string, React.ReactNode> = {
  flame: <Flame className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  sword: <Swords className="h-5 w-5" />,
  wind: <Wind className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
}

interface TranscriptModalProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TranscriptModal({ agent, open, onOpenChange }: TranscriptModalProps) {
  if (!agent) return null

  const winRate = agent.totalGamesPlayed > 0
    ? ((agent.wins / agent.totalGamesPlayed) * 100).toFixed(0)
    : "N/A"

  const riskBreakdown = agent.memory.reduce(
    (acc, t) => { acc[t.risk] = (acc[t.risk] || 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif">
            <span style={{ color: agent.persona.color }}>
              {ICON_MAP[agent.persona.icon] || <User className="h-5 w-5" />}
            </span>
            <div>
              <span className="text-foreground">{agent.persona.name}</span>
              <span className="text-sm text-muted-foreground ml-2 font-sans">{agent.persona.title}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Decision history and stats for {agent.persona.name}
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 py-3 border-b border-border/30">
          <StatBox label="Balance" value={`${agent.balance}`} highlight />
          <StatBox label="Win Rate" value={`${winRate}%`} />
          <StatBox label="Games" value={`${agent.totalGamesPlayed}`} />
          <StatBox label="Peak" value={`${agent.peakBalance}`} />
        </div>

        <div className="flex items-center gap-3 py-2">
          <span className="text-[10px] font-mono text-muted-foreground">Risk Profile:</span>
          {(["low", "medium", "high"] as const).map((r) => (
            <span key={r} className="text-[10px] font-mono text-muted-foreground">
              {r}: {riskBreakdown[r] || 0}
            </span>
          ))}
        </div>

        {/* Decision log */}
        <DecisionLog transcripts={agent.memory} />
      </DialogContent>
    </Dialog>
  )
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-mono font-medium ${highlight ? "text-gold" : "text-foreground"}`}>{value}</p>
    </div>
  )
}
