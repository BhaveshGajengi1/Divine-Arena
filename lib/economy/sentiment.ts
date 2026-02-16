import type { ArenaEvent, SentimentMetrics, Agent } from "../types"
import { SENTIMENT_WEIGHTS, BIG_WAGER_THRESHOLD } from "../constants"

// ==========================================
// Sentiment Scoring Engine
// ==========================================

const sentimentHistory: SentimentMetrics[] = []
let currentSentiment = 50 // Start at neutral

export function calculateSentiment(
  tick: number,
  events: ArenaEvent[],
  agents: Record<string, Agent>
): SentimentMetrics {
  const triggers: string[] = []
  let delta = 0

  // Calculate event-driven sentiment changes
  for (const event of events) {
    switch (event.type) {
      case "persuasion_attempt":
        delta += SENTIMENT_WEIGHTS.persuasion_success
        triggers.push("Persuasion event")
        break
      case "game_resolve":
        delta += SENTIMENT_WEIGHTS.game_completed
        if (event.amount && event.amount > BIG_WAGER_THRESHOLD) {
          delta += SENTIMENT_WEIGHTS.big_wager_win
          triggers.push(`Big wager resolved: ${event.amount} tokens`)
        }
        break
      case "alliance_formed":
        delta += SENTIMENT_WEIGHTS.alliance_formed
        triggers.push("Alliance formed")
        break
      case "agent_fallen":
        delta += SENTIMENT_WEIGHTS.agent_fallen
        triggers.push(`${event.agentName} eliminated`)
        break
      case "token_transfer":
        delta += SENTIMENT_WEIGHTS.token_transfer
        break
    }
  }

  // Apply sentiment change with dampening
  currentSentiment = Math.max(0, Math.min(100, currentSentiment + delta * 0.5))

  // Calculate per-tick economy metrics
  const activeAgents = Object.values(agents).filter((a) => a.status === "active")
  const balances = activeAgents.map((a) => a.balance).sort((a, b) => b - a)
  const totalBalance = balances.reduce((s, b) => s + b, 0)

  const topTwoBalance = (balances[0] || 0) + (balances[1] || 0)
  const dominance = totalBalance > 0 ? (topTwoBalance / totalBalance) * 100 : 0

  const transferEvents = events.filter(
    (e) => e.type === "token_transfer" || e.type === "game_resolve"
  )
  const wagerEvents = events.filter(
    (e) => e.type === "game_start" || e.type === "game_resolve"
  )

  const metrics: SentimentMetrics = {
    tick,
    demandIndex: wagerEvents.length,
    influenceScore: activeAgents.reduce((sum, a) => sum + a.alliances.length, 0),
    velocity: transferEvents.length,
    dominance: Math.round(dominance * 10) / 10,
    sentimentScore: Math.round(currentSentiment * 10) / 10,
    triggers,
  }

  sentimentHistory.push(metrics)
  return metrics
}

export function getSentimentHistory(): SentimentMetrics[] {
  return sentimentHistory
}

export function getLatestSentiment(): SentimentMetrics | undefined {
  return sentimentHistory[sentimentHistory.length - 1]
}

export function resetSentiment(): void {
  sentimentHistory.length = 0
  currentSentiment = 50
}
