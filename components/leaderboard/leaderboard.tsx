"use client"

import { AgentCard } from "@/components/arena/agent-card"
import type { Agent } from "@/lib/types"

interface LeaderboardProps {
  agents: Record<string, Agent>
  onAgentClick?: (agentId: string) => void
}

export function Leaderboard({ agents, onAgentClick }: LeaderboardProps) {
  const sorted = Object.values(agents)
    .filter((a) => a.status === "active")
    .sort((a, b) => b.balance - a.balance)

  const fallen = Object.values(agents).filter((a) => a.status === "fallen")

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Leaderboard
      </h3>
      <div className="flex flex-col gap-1.5">
        {sorted.map((agent, i) => (
          <div key={agent.id} className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
              {i + 1}.
            </span>
            <div className="flex-1">
              <AgentCard agent={agent} compact onClick={() => onAgentClick?.(agent.id)} />
            </div>
          </div>
        ))}
      </div>

      {fallen.length > 0 && (
        <div className="mt-3 pt-3 border-t border-destructive/20">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-destructive/60 mb-2">
            Hall of the Fallen
          </h4>
          <div className="flex flex-col gap-1">
            {fallen.map((agent) => (
              <AgentCard key={agent.id} agent={agent} compact onClick={() => onAgentClick?.(agent.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
