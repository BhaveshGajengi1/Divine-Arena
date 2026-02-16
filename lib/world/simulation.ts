import type { ArenaEvent, DemoMode, EconomySnapshot, TickResponse, GameType } from "../types"
import {
  getWorldState,
  getActiveAgents,
  addEvent,
  markAgentFallen,
  updateAgentBalance,
  addAlliance,
  moveAgent,
  cloneWorldState,
} from "./world-state"
import { getAgentDecision, createForcedDecision } from "../agents/decision-engine"
import { createGame, resolveGame, getActiveGames } from "../agents/game-logic"
import { getAgentById } from "../agents/agent-system"
import { calculateSentiment } from "../economy/sentiment"
import { recordEconomySnapshot } from "../economy/price-model"
import { recordTickSnapshot } from "./event-log"
import { addTransaction } from "../blockchain/tx-log"
import { sendArenaTransaction } from "../blockchain/token-operations"
import { getDemoEventsForTick } from "../demo/demo-script"
import { AGENT_PERSONAS } from "../constants"

// ==========================================
// World Simulation Engine
// ==========================================

let lastTickSpeed = 0

export function getLastTickSpeed(): number {
  return lastTickSpeed
}

export async function runTick(
  mode: DemoMode,
  forcedEvent?: "persuasion" | "alliance"
): Promise<TickResponse> {
  const state = getWorldState()
  state.tick++
  const tickStart = Date.now()

  const tickEvents: ArenaEvent[] = []
  let tickWagered = 0
  let tickTransferred = 0

  const activeAgents = getActiveAgents()

  // Handle forced events
  if (forcedEvent) {
    const result = await handleForcedEvent(forcedEvent, tickEvents, mode)
    tickTransferred += result.transferred
  }

  // Get demo script events if in demo mode
  const demoEvents = mode === "demo" ? getDemoEventsForTick(state.tick) : []

  // Each active agent makes a decision
  for (const agent of activeAgents) {
    if (agent.isHuman) continue // Humans act manually

    const demoEvent = demoEvents.find((e) => e.agentId === agent.id)
    const demoDecision = demoEvent?.transcript
      ? { ...demoEvent.transcript, action: demoEvent.type === "decision" ? demoEvent.transcript.decision : "observe" }
      : undefined

    const decision = await getAgentDecision(agent, mode, demoDecision)

    // Process decision
    switch (decision.action) {
      case "challenge": {
        const target = decision.targetAgentId
          ? getAgentById(decision.targetAgentId) ||
            activeAgents.find((a) => a.persona.name.toLowerCase() === decision.targetAgentId?.toLowerCase())
          : activeAgents.find((a) => a.id !== agent.id)

        if (target && target.status === "active") {
          const wagerAmount = Math.min(decision.amount || 30, agent.balance)
          const game = createGame(
            decision.gameType || "sacrifice_duel",
            [agent.id, target.id],
            [
              { agentId: agent.id, amount: wagerAmount, move: decision.move || "sacrifice" },
              { agentId: target.id, amount: wagerAmount, move: Math.random() > 0.5 ? "sacrifice" : "hoard" },
            ]
          )
          tickWagered += wagerAmount * 2
          tickEvents.push(createEvent("game_start", state.tick, agent.id, agent.persona.name,
            `${agent.persona.name} challenges ${target.persona.name} to a ${game.type.replace("_", " ")} (${wagerAmount} tokens wagered)`,
            game.id
          ))

          // Auto-resolve
          const result = resolveGame(game.id)
          if (result) {
            let txHash = generateTxHash()
            let blockNumber: number | undefined

            // Send real on-chain tx in live mode
            if (mode === "live") {
              try {
                const receipt = await sendArenaTransaction({
                  type: "wager",
                  fromAgent: agent.persona.name,
                  toAgent: target.persona.name,
                  gameTokenAmount: game.pot,
                  tick: state.tick,
                })
                if (receipt) {
                  txHash = receipt.txHash
                  blockNumber = receipt.blockNumber
                }
              } catch { /* chain tx failed, use mock hash */ }
            }

            tickEvents.push(createEvent("game_resolve", state.tick, result.winnerId || agent.id,
              result.winnerId ? getAgentById(result.winnerId)?.persona.name || "Unknown" : agent.persona.name,
              result.narrative,
              game.id, undefined, game.pot
            ))

            addTransaction({
              txHash,
              type: "wager",
              fromAgent: agent.persona.name,
              toAgent: target.persona.name,
              amount: game.pot,
              tick: state.tick,
              timestamp: Date.now(),
              blockNumber,
            })
          }
        }
        break
      }
      case "transfer": {
        const target = decision.targetAgentId
          ? getAgentById(decision.targetAgentId) || activeAgents.find((a) => a.persona.name.toLowerCase() === decision.targetAgentId?.toLowerCase())
          : null
        if (target && decision.amount && decision.amount > 0) {
          const amount = Math.min(decision.amount, agent.balance)
          updateAgentBalance(agent.id, -amount)
          updateAgentBalance(target.id, amount)
          tickTransferred += amount
          let transferHash = generateTxHash()
          let transferBlock: number | undefined
          if (mode === "live") {
            try {
              const receipt = await sendArenaTransaction({
                type: "transfer",
                fromAgent: agent.persona.name,
                toAgent: target.persona.name,
                gameTokenAmount: amount,
                tick: state.tick,
              })
              if (receipt) {
                transferHash = receipt.txHash
                transferBlock = receipt.blockNumber
              }
            } catch { /* chain tx failed, use mock hash */ }
          }

          tickEvents.push(createEvent("token_transfer", state.tick, agent.id, agent.persona.name,
            `${agent.persona.name} transfers ${amount} tokens to ${target.persona.name}`,
            undefined, target.id, amount
          ))

          addTransaction({
            txHash: transferHash,
            type: "transfer",
            fromAgent: agent.persona.name,
            toAgent: target.persona.name,
            amount,
            tick: state.tick,
            timestamp: Date.now(),
            blockNumber: transferBlock,
          })
        }
        break
      }
      case "move": {
        const zones = ["temple_of_games", "market_square", "oracles_sanctum", "training_grounds"] as const
        const newZone = zones.find((z) => z.includes(decision.zone || "")) || zones[Math.floor(Math.random() * zones.length)]
        if (newZone !== agent.zone) {
          moveAgent(agent.id, newZone)
          tickEvents.push(createEvent("zone_move", state.tick, agent.id, agent.persona.name,
            `${agent.persona.name} moves to ${state.zones[newZone].name}`
          ))
        }
        break
      }
      default: {
        tickEvents.push(createEvent("agent_decision", state.tick, agent.id, agent.persona.name,
          `${agent.persona.name} observes the arena. "${decision.transcript.reasoning}"`
        ))
        break
      }
    }
  }

  // Resolve any remaining active games
  for (const game of getActiveGames()) {
    if (game.createdAtTick < state.tick) {
      const result = resolveGame(game.id)
      if (result) {
        tickEvents.push(createEvent("game_resolve", state.tick, result.winnerId || "",
          result.winnerId ? getAgentById(result.winnerId)?.persona.name || "Unknown" : "Draw",
          result.narrative, game.id, undefined, game.pot
        ))
      }
    }
  }

  // Bankruptcy check
  for (const agent of Object.values(state.agents)) {
    if (agent.status === "active" && agent.balance <= 0) {
      markAgentFallen(agent.id)
      tickEvents.push(createEvent("agent_fallen", state.tick, agent.id, agent.persona.name,
        `${agent.persona.name} has fallen from the arena after losing all tokens.`
      ))
    }
  }

  // Record events
  tickEvents.forEach(addEvent)

  // Calculate sentiment
  const sentiment = calculateSentiment(state.tick, tickEvents, state.agents)

  // Record economy snapshot
  const economy = recordEconomySnapshot(state.tick, state.agents, sentiment, tickWagered, tickTransferred)

  // Record full state snapshot for replay
  recordTickSnapshot(cloneWorldState(), tickEvents, economy)

  // Tick complete event
  tickEvents.push(createEvent("tick_complete", state.tick, undefined, undefined,
    `Tick ${state.tick} complete. ${getActiveAgents().length} agents active.`
  ))

  lastTickSpeed = Date.now() - tickStart

  return {
    tick: state.tick,
    events: tickEvents,
    agents: state.agents,
    games: state.games.slice(-20),
    economy,
  }
}

export async function forceGameCreation(
  gameType: GameType = "sacrifice_duel",
  mode: DemoMode
): Promise<TickResponse> {
  const state = getWorldState()
  const active = getActiveAgents().filter((a) => !a.isHuman)
  if (active.length < 2) {
    return { tick: state.tick, events: [], agents: state.agents, games: [], economy: { tick: state.tick, totalSupply: 0, totalWagered: 0, totalTransferred: 0, agentBalances: {}, sentiment: { tick: state.tick, demandIndex: 0, influenceScore: 0, velocity: 0, dominance: 0, sentimentScore: 50, triggers: [] } } }
  }

  // Pick two random agents
  const shuffled = [...active].sort(() => Math.random() - 0.5)
  const [a, b] = shuffled

  const wagerAmount = 50
  const game = createGame(gameType, [a.id, b.id], [
    { agentId: a.id, amount: wagerAmount, move: Math.random() > 0.5 ? "sacrifice" : "hoard" },
    { agentId: b.id, amount: wagerAmount, move: Math.random() > 0.5 ? "sacrifice" : "hoard" },
  ])

  const events: ArenaEvent[] = [
    createEvent("game_start", state.tick, a.id, a.persona.name,
      `[FORCED] ${a.persona.name} vs ${b.persona.name} in ${gameType.replace("_", " ")} (${wagerAmount} tokens each)`,
      game.id
    ),
  ]

  const result = resolveGame(game.id)
  if (result) {
    events.push(createEvent("game_resolve", state.tick, result.winnerId || a.id,
      result.winnerId ? getAgentById(result.winnerId)?.persona.name || "Unknown" : "Draw",
      result.narrative, game.id, undefined, game.pot
    ))

    let forceHash = generateTxHash()
    if (mode === "live") {
      try {
        const r = await sendArenaTransaction({ type: "wager", fromAgent: a.persona.name, toAgent: b.persona.name, gameTokenAmount: game.pot, tick: state.tick })
        if (r) forceHash = r.txHash
      } catch { /* chain tx failed */ }
    }
    addTransaction({ txHash: forceHash, type: "wager", fromAgent: a.persona.name, toAgent: b.persona.name, amount: game.pot, tick: state.tick, timestamp: Date.now() })
  }

  events.forEach(addEvent)
  const sentiment = calculateSentiment(state.tick, events, state.agents)
  const economy = recordEconomySnapshot(state.tick, state.agents, sentiment, wagerAmount * 2, 0)

  return { tick: state.tick, events, agents: state.agents, games: [game], economy }
}

async function handleForcedEvent(
  type: "persuasion" | "alliance",
  tickEvents: ArenaEvent[],
  _mode: DemoMode
): Promise<{ transferred: number }> {
  const active = getActiveAgents().filter((a) => !a.isHuman)
  if (active.length < 2) return { transferred: 0 }

  const shuffled = [...active].sort(() => Math.random() - 0.5)
  const [agentA, agentB] = shuffled
  const state = getWorldState()

  if (type === "alliance") {
    addAlliance(agentA.id, agentB.id)
    tickEvents.push(createEvent("alliance_formed", state.tick, agentA.id, agentA.persona.name,
      `${agentA.persona.name} and ${agentB.persona.name} form a strategic alliance.`,
      undefined, agentB.id
    ))
    createForcedDecision("alliance", agentA, agentB)
  } else if (type === "persuasion") {
    tickEvents.push(createEvent("persuasion_attempt", state.tick, agentA.id, agentA.persona.name,
      `${agentA.persona.name} attempts to persuade ${agentB.persona.name} to join their cause.`,
      undefined, agentB.id
    ))
    createForcedDecision("persuasion", agentA, agentB)
  }

  return { transferred: 0 }
}

function createEvent(
  type: ArenaEvent["type"],
  tick: number,
  agentId?: string,
  agentName?: string,
  message?: string,
  gameId?: string,
  targetId?: string,
  amount?: number
): ArenaEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    tick,
    agentId: agentId || undefined,
    agentName: agentName || undefined,
    targetId: targetId || undefined,
    gameId: gameId || undefined,
    amount: amount || undefined,
    message: message || "",
    timestamp: Date.now(),
  }
}

function generateTxHash(): string {
  const chars = "0123456789abcdef"
  let hash = "0x"
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)]
  }
  return hash
}
