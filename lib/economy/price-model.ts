import type { Agent, EconomySnapshot, SentimentMetrics } from "../types"

// ==========================================
// Token Economy Model
// ==========================================

const economyHistory: EconomySnapshot[] = []
let totalWagered = 0
let totalTransferred = 0

export function recordEconomySnapshot(
  tick: number,
  agents: Record<string, Agent>,
  sentiment: SentimentMetrics,
  tickWagered: number,
  tickTransferred: number
): EconomySnapshot {
  totalWagered += tickWagered
  totalTransferred += tickTransferred

  const balances: Record<string, number> = {}
  let totalSupply = 0
  for (const [id, agent] of Object.entries(agents)) {
    balances[id] = agent.balance
    totalSupply += agent.balance
  }

  const snapshot: EconomySnapshot = {
    tick,
    totalSupply,
    totalWagered,
    totalTransferred,
    agentBalances: balances,
    sentiment,
  }

  economyHistory.push(snapshot)
  return snapshot
}

export function getEconomyHistory(): EconomySnapshot[] {
  return economyHistory
}

export function getLatestEconomy(): EconomySnapshot | undefined {
  return economyHistory[economyHistory.length - 1]
}

export function getAgentDominance(agents: Record<string, Agent>): { agentId: string; name: string; percentage: number; balance: number }[] {
  const active = Object.values(agents).filter((a) => a.status === "active")
  const total = active.reduce((s, a) => s + a.balance, 0)
  if (total === 0) return []

  return active
    .map((a) => ({
      agentId: a.id,
      name: a.persona.name,
      percentage: Math.round((a.balance / total) * 1000) / 10,
      balance: a.balance,
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

export function getTotalWagered(): number {
  return totalWagered
}

export function getTotalTransferred(): number {
  return totalTransferred
}

export function resetEconomy(): void {
  economyHistory.length = 0
  totalWagered = 0
  totalTransferred = 0
}
