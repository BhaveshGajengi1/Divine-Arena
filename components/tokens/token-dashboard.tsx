"use client"

import { SentimentChart } from "./sentiment-chart"
import { DominanceChart } from "./dominance-chart"
import { TokenFlowChart } from "./token-flow-chart"
import type { Agent, EconomySnapshot, SentimentMetrics } from "@/lib/types"

interface TokenDashboardProps {
  agents: Record<string, Agent>
  economyHistory: EconomySnapshot[]
  sentimentHistory: SentimentMetrics[]
}

export function TokenDashboard({ agents, economyHistory, sentimentHistory }: TokenDashboardProps) {
  const activeAgents = Object.values(agents).filter((a) => a.status === "active")
  const totalWagered = economyHistory.reduce((s, e) => s + e.totalWagered, 0)
  const totalTransferred = economyHistory.reduce((s, e) => s + e.totalTransferred, 0)
  const latestSentiment = sentimentHistory[sentimentHistory.length - 1]

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Wagered" value={totalWagered.toLocaleString()} />
        <StatCard label="Total Transferred" value={totalTransferred.toLocaleString()} />
        <StatCard label="Active Agents" value={`${activeAgents.length}`} />
        <StatCard label="Sentiment" value={latestSentiment ? latestSentiment.sentimentScore.toFixed(0) : "50"} highlight />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card/40 border border-border/30 rounded-lg p-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Sentiment Over Time
          </h4>
          <SentimentChart data={sentimentHistory} />
        </div>
        <div className="bg-card/40 border border-border/30 rounded-lg p-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Token Dominance
          </h4>
          <DominanceChart agents={agents} />
        </div>
      </div>

      <div className="bg-card/40 border border-border/30 rounded-lg p-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Token Flow (Wagers + Transfers per Tick)
        </h4>
        <TokenFlowChart data={economyHistory} />
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card/40 border border-border/30 rounded-lg p-3 text-center">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-mono font-semibold mt-1 ${highlight ? "text-gold" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
