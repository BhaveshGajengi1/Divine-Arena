import type { WorldState, Agent, ZoneId, ArenaEvent } from "../types"
import { AGENT_PERSONAS, ZONES, STARTING_BALANCE, TOTAL_SUPPLY } from "../constants"

// ==========================================
// World State Singleton
// ==========================================

let worldState: WorldState | null = null

function createInitialAgents(): Record<string, Agent> {
  const agents: Record<string, Agent> = {}
  const zoneIds: ZoneId[] = ["temple_of_games", "market_square", "oracles_sanctum", "training_grounds"]

  AGENT_PERSONAS.forEach((persona, i) => {
    const zone = zoneIds[i % zoneIds.length]
    agents[persona.id] = {
      id: persona.id,
      persona,
      status: "active",
      balance: STARTING_BALANCE,
      zone,
      wins: 0,
      losses: 0,
      totalGamesPlayed: 0,
      peakBalance: STARTING_BALANCE,
      alliances: [],
      followers: [],
      memory: [],
    }
  })

  return agents
}

function createInitialZones(): Record<ZoneId, typeof ZONES[ZoneId]> {
  const zones = JSON.parse(JSON.stringify(ZONES)) as Record<ZoneId, typeof ZONES[ZoneId]>
  // Distribute agents to their starting zones
  const agents = AGENT_PERSONAS
  const zoneIds: ZoneId[] = ["temple_of_games", "market_square", "oracles_sanctum", "training_grounds"]
  agents.forEach((persona, i) => {
    const zone = zoneIds[i % zoneIds.length]
    zones[zone].agents.push(persona.id)
  })
  return zones
}

export function getWorldState(): WorldState {
  if (!worldState) {
    worldState = {
      tick: 0,
      agents: createInitialAgents(),
      zones: createInitialZones(),
      games: [],
      totalTokenSupply: TOTAL_SUPPLY,
      events: [],
      isRunning: false,
      startedAt: Date.now(),
    }
  }
  return worldState
}

export function resetWorldState(): WorldState {
  worldState = null
  return getWorldState()
}

export function addEvent(event: ArenaEvent): void {
  const state = getWorldState()
  state.events.push(event)
  // Keep only last 200 events in active state
  if (state.events.length > 200) {
    state.events = state.events.slice(-200)
  }
}

export function getActiveAgents(): Agent[] {
  const state = getWorldState()
  return Object.values(state.agents).filter((a) => a.status === "active")
}

export function getAgent(id: string): Agent | undefined {
  return getWorldState().agents[id]
}

export function updateAgentBalance(agentId: string, delta: number): void {
  const agent = getAgent(agentId)
  if (!agent) return
  agent.balance += delta
  if (agent.balance > agent.peakBalance) {
    agent.peakBalance = agent.balance
  }
}

export function moveAgent(agentId: string, toZone: ZoneId): void {
  const state = getWorldState()
  const agent = state.agents[agentId]
  if (!agent) return

  // Remove from current zone
  const currentZone = state.zones[agent.zone]
  currentZone.agents = currentZone.agents.filter((id) => id !== agentId)

  // Add to new zone
  state.zones[toZone].agents.push(agentId)
  agent.zone = toZone
}

export function markAgentFallen(agentId: string): void {
  const agent = getAgent(agentId)
  if (!agent) return
  agent.status = "fallen"
  agent.balance = 0

  // Dissolve alliances
  const state = getWorldState()
  agent.alliances.forEach((allyId) => {
    const ally = state.agents[allyId]
    if (ally) {
      ally.alliances = ally.alliances.filter((id) => id !== agentId)
    }
  })
  agent.alliances = []
  agent.followers = []
}

export function addAlliance(agentA: string, agentB: string): void {
  const state = getWorldState()
  const a = state.agents[agentA]
  const b = state.agents[agentB]
  if (!a || !b) return
  if (!a.alliances.includes(agentB)) a.alliances.push(agentB)
  if (!b.alliances.includes(agentA)) b.alliances.push(agentA)
}

export function addHumanPlayer(name: string, walletAddress: string): Agent {
  const state = getWorldState()
  const id = `human_${Date.now()}`
  const agent: Agent = {
    id,
    persona: {
      id,
      name,
      title: "Human Champion",
      description: "A mortal who dares to challenge the divine agents.",
      strategyBias: "human",
      systemPrompt: "",
      color: "#e8c547",
      icon: "user",
    },
    status: "active",
    balance: STARTING_BALANCE,
    zone: "temple_of_games",
    wins: 0,
    losses: 0,
    totalGamesPlayed: 0,
    peakBalance: STARTING_BALANCE,
    alliances: [],
    followers: [],
    memory: [],
    isHuman: true,
    walletAddress,
  }
  state.agents[id] = agent
  state.zones.temple_of_games.agents.push(id)
  state.totalTokenSupply += STARTING_BALANCE
  return agent
}

export function cloneWorldState(): WorldState {
  return JSON.parse(JSON.stringify(getWorldState()))
}
