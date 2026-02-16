import type { Agent, DecisionTranscript, ZoneId } from "../types"
import { getWorldState, getActiveAgents } from "../world/world-state"
import { AGENT_PERSONAS } from "../constants"

// ==========================================
// Agent System — Persona & State Management
// ==========================================

export function getAgentById(id: string): Agent | undefined {
  return getWorldState().agents[id]
}

export function getAgentsByZone(zone: ZoneId): Agent[] {
  return getActiveAgents().filter((a) => a.zone === zone)
}

export function getAgentMemory(agentId: string, limit = 10): DecisionTranscript[] {
  const agent = getWorldState().agents[agentId]
  if (!agent) return []
  return agent.memory.slice(-limit)
}

export function addToAgentMemory(agentId: string, transcript: DecisionTranscript): void {
  const agent = getWorldState().agents[agentId]
  if (!agent) return
  agent.memory.push(transcript)
  // Keep only last 20 memories
  if (agent.memory.length > 20) {
    agent.memory = agent.memory.slice(-20)
  }
}

export function getAgentContext(agentId: string): string {
  const state = getWorldState()
  const agent = state.agents[agentId]
  if (!agent) return ""

  const nearbyAgents = getAgentsByZone(agent.zone)
    .filter((a) => a.id !== agentId)
    .map((a) => `${a.persona.name} (${a.balance} tokens, ${a.status})`)
    .join(", ")

  const recentMemory = getAgentMemory(agentId, 5)
    .map(
      (m) =>
        `Tick ${m.tick}: ${m.decision} in ${m.gameContext} — ${m.actualOutcome || "pending"} (${m.tokenDelta !== undefined ? (m.tokenDelta >= 0 ? "+" : "") + m.tokenDelta : "?"} tokens)`
    )
    .join("\n")

  const activeGames = state.games
    .filter((g) => g.status === "active" && g.players.includes(agentId))
    .map((g) => `${g.type} (pot: ${g.pot})`)
    .join(", ")

  const alliances = agent.alliances
    .map((id) => state.agents[id]?.persona.name)
    .filter(Boolean)
    .join(", ")

  return `=== WORLD STATE (Tick ${state.tick}) ===
Your Balance: ${agent.balance} tokens
Your Zone: ${state.zones[agent.zone].name}
Nearby Agents: ${nearbyAgents || "None"}
Active Games: ${activeGames || "None"}
Alliances: ${alliances || "None"}
Total Agents Active: ${getActiveAgents().length}
WARNING: If your balance reaches 0, you will be eliminated from the arena.

=== RECENT HISTORY ===
${recentMemory || "No prior actions."}
`
}

export function getPersonaById(id: string) {
  return AGENT_PERSONAS.find((p) => p.id === id)
}

export function getRankedAgents(): Agent[] {
  return Object.values(getWorldState().agents)
    .sort((a, b) => b.balance - a.balance)
}

export function getTopAgents(n: number): Agent[] {
  return getRankedAgents().slice(0, n)
}

export function getAgentStats(agentId: string) {
  const agent = getWorldState().agents[agentId]
  if (!agent) return null
  const winRate = agent.totalGamesPlayed > 0 ? agent.wins / agent.totalGamesPlayed : 0
  const avgRisk = agent.memory.length > 0
    ? agent.memory.reduce((sum, m) => sum + (m.risk === "high" ? 3 : m.risk === "medium" ? 2 : 1), 0) / agent.memory.length
    : 0

  return {
    winRate: Math.round(winRate * 100),
    avgRisk: avgRisk < 1.5 ? "low" : avgRisk < 2.5 ? "medium" : "high",
    totalDecisions: agent.memory.length,
    netTokenChange: agent.balance - 500,
    peakBalance: agent.peakBalance,
  }
}
