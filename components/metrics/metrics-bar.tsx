"use client"

import { Swords, Users, Coins, Clock, TrendingUp } from "lucide-react"

interface MetricsBarProps {
  tick: number
  activeAgents: number
  activeGames: number
  totalTokens: number
  sentiment?: number
}

export function MetricsBar({ tick, activeAgents, activeGames, totalTokens, sentiment }: MetricsBarProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-card/50 border-b border-border/50 overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
        <span className="text-[10px] font-mono text-muted-foreground/70 uppercase">Live</span>
      </div>
      <div className="h-3 w-px bg-border/40 shrink-0" />
      <MetricItem icon={<Clock className="h-3.5 w-3.5" />} label="Tick" value={tick} />
      <MetricItem icon={<Users className="h-3.5 w-3.5" />} label="Agents" value={activeAgents} />
      <MetricItem icon={<Swords className="h-3.5 w-3.5" />} label="Games" value={activeGames} />
      <MetricItem icon={<Coins className="h-3.5 w-3.5" />} label="Tokens" value={totalTokens.toLocaleString()} />
      {sentiment !== undefined && (
        <MetricItem
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Sentiment"
          value={sentiment.toFixed(1)}
          highlight={sentiment > 60}
          danger={sentiment < 30}
        />
      )}
    </div>
  )
}

function MetricItem({
  icon,
  label,
  value,
  highlight,
  danger,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span
        className={`text-sm font-medium font-mono ${
          highlight ? "text-gold" : danger ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
