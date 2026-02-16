import type { Game, GameResult, GameType, GameMove, GameWager } from "../types"
import { DUEL_PAYOFFS } from "../constants"
import { getWorldState, updateAgentBalance, getAgent } from "../world/world-state"

// ==========================================
// Game Logic — Three Game Types
// ==========================================

let gameIdCounter = 0

export function createGame(
  type: GameType,
  playerIds: string[],
  wagers: GameWager[]
): Game {
  const state = getWorldState()
  const id = `game_${++gameIdCounter}_t${state.tick}`
  const pot = wagers.reduce((sum, w) => sum + w.amount, 0)

  const game: Game = {
    id,
    type,
    status: "active",
    players: playerIds,
    wagers,
    pot,
    createdAtTick: state.tick,
  }

  state.games.push(game)
  return game
}

export function resolveGame(gameId: string): GameResult | null {
  const state = getWorldState()
  const game = state.games.find((g) => g.id === gameId)
  if (!game || game.status !== "active") return null

  let result: GameResult

  switch (game.type) {
    case "sacrifice_duel":
      result = resolveSacrificeDuel(game)
      break
    case "oracles_gambit":
      result = resolveOraclesGambit(game)
      break
    case "tribute_war":
      result = resolveTributeWar(game)
      break
    default:
      return null
  }

  game.status = "resolved"
  game.resolvedAtTick = state.tick
  game.winnerId = result.winnerId || undefined
  game.results = result

  // Apply payouts
  for (const [agentId, amount] of Object.entries(result.payouts)) {
    updateAgentBalance(agentId, amount)
    const agent = getAgent(agentId)
    if (agent) {
      agent.totalGamesPlayed++
      if (amount > 0) agent.wins++
      else if (amount < 0) agent.losses++
    }
  }

  return result
}

function resolveSacrificeDuel(game: Game): GameResult {
  const [wagerA, wagerB] = game.wagers
  if (!wagerA?.move || !wagerB?.move) {
    return { winnerId: null, losers: [], payouts: {}, narrative: "Duel incomplete." }
  }

  const aSacrifice = wagerA.move === "sacrifice"
  const bSacrifice = wagerB.move === "sacrifice"

  let payoffKey: keyof typeof DUEL_PAYOFFS
  if (aSacrifice && bSacrifice) payoffKey = "mutual_sacrifice"
  else if (aSacrifice && !bSacrifice) payoffKey = "a_sacrifice_b_hoard"
  else if (!aSacrifice && bSacrifice) payoffKey = "a_hoard_b_sacrifice"
  else payoffKey = "mutual_hoard"

  const payoffs = DUEL_PAYOFFS[payoffKey]
  const agentA = getAgent(wagerA.agentId)
  const agentB = getAgent(wagerB.agentId)

  const narrative = buildDuelNarrative(
    agentA?.persona.name || wagerA.agentId,
    agentB?.persona.name || wagerB.agentId,
    wagerA.move,
    wagerB.move,
    payoffs
  )

  const losers: string[] = []
  if (payoffs.a < 0) losers.push(wagerA.agentId)
  if (payoffs.b < 0) losers.push(wagerB.agentId)

  const winnerId = payoffs.a > payoffs.b ? wagerA.agentId : payoffs.b > payoffs.a ? wagerB.agentId : null

  return {
    winnerId,
    losers,
    payouts: {
      [wagerA.agentId]: payoffs.a,
      [wagerB.agentId]: payoffs.b,
    },
    narrative,
  }
}

function resolveOraclesGambit(game: Game): GameResult {
  // Oracle resolves based on world state prediction
  const state = getWorldState()
  const totalBalance = Object.values(state.agents)
    .filter((a) => a.status === "active")
    .reduce((s, a) => s + a.balance, 0)

  // The "truth" — did total supply increase this tick? (simplified: random for now)
  const oracleResult = totalBalance >= 3000 // Above starting supply = growth

  const payouts: Record<string, number> = {}
  const losers: string[] = []
  let winnerId: string | null = null
  let maxPayout = 0

  for (const wager of game.wagers) {
    const betOnGrowth = wager.move === "bet_yes"
    if (betOnGrowth === oracleResult) {
      payouts[wager.agentId] = wager.amount
      if (wager.amount > maxPayout) {
        maxPayout = wager.amount
        winnerId = wager.agentId
      }
    } else {
      payouts[wager.agentId] = -wager.amount
      losers.push(wager.agentId)
    }
  }

  return {
    winnerId,
    losers,
    payouts,
    narrative: `The Oracle reveals: the arena's economy has ${oracleResult ? "grown" : "contracted"}. ${Object.keys(payouts).filter((id) => (payouts[id] || 0) > 0).length} agent(s) predicted correctly.`,
  }
}

function resolveTributeWar(game: Game): GameResult {
  // Largest contributor wins 2x their stake, others lose
  const sortedWagers = [...game.wagers].sort((a, b) => b.amount - a.amount)
  const winnerId = sortedWagers[0]?.agentId || null
  const payouts: Record<string, number> = {}
  const losers: string[] = []

  for (const wager of game.wagers) {
    if (wager.agentId === winnerId) {
      payouts[wager.agentId] = wager.amount // Win their stake back + profit
    } else {
      payouts[wager.agentId] = -wager.amount
      losers.push(wager.agentId)
    }
  }

  const winner = getAgent(winnerId || "")
  return {
    winnerId,
    losers,
    payouts,
    narrative: `${winner?.persona.name || "Unknown"} dominates the Tribute War with the largest offering, claiming the war chest.`,
  }
}

function buildDuelNarrative(
  nameA: string,
  nameB: string,
  moveA: GameMove,
  moveB: GameMove,
  payoffs: { a: number; b: number }
): string {
  if (moveA === "sacrifice" && moveB === "sacrifice") {
    return `${nameA} and ${nameB} both chose to sacrifice — a rare moment of mutual trust. Both gain ${payoffs.a} tokens.`
  }
  if (moveA === "sacrifice" && moveB === "hoard") {
    return `${nameA} sacrificed in good faith, but ${nameB} betrayed the pact and hoarded. ${nameB} gains ${payoffs.b} tokens while ${nameA} loses ${Math.abs(payoffs.a)}.`
  }
  if (moveA === "hoard" && moveB === "sacrifice") {
    return `${nameA} exploited ${nameB}'s trust by hoarding while ${nameB} sacrificed. ${nameA} gains ${payoffs.a} tokens.`
  }
  return `Both ${nameA} and ${nameB} chose to hoard — mutual distrust costs them each ${Math.abs(payoffs.a)} tokens.`
}

export function getActiveGames(): Game[] {
  return getWorldState().games.filter((g) => g.status === "active")
}

export function getRecentGames(limit = 10): Game[] {
  return getWorldState().games.slice(-limit)
}

export function getGameById(id: string): Game | undefined {
  return getWorldState().games.find((g) => g.id === id)
}
