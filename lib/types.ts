// ==========================================
// Divine Arena — Core Type Definitions
// ==========================================

// --- Agent Types ---

export type AgentStatus = "active" | "fallen"
export type RiskLevel = "low" | "medium" | "high"
export type ZoneId = "temple_of_games" | "market_square" | "oracles_sanctum" | "training_grounds"

export interface AgentPersona {
  id: string
  name: string
  title: string
  description: string
  strategyBias: string
  systemPrompt: string
  color: string
  icon: string
}

export interface Agent {
  id: string
  persona: AgentPersona
  status: AgentStatus
  balance: number
  zone: ZoneId
  wins: number
  losses: number
  totalGamesPlayed: number
  peakBalance: number
  alliances: string[] // agent IDs
  followers: string[] // agent IDs
  memory: DecisionTranscript[]
  isHuman?: boolean
  walletAddress?: string
}

// --- Decision Transcript ---

export interface DecisionTranscript {
  agentId: string
  agentName: string
  tick: number
  gameContext: string
  decision: string
  reasoning: string
  risk: RiskLevel
  expectedOutcome: string
  actualOutcome?: string
  tokenDelta?: number
  timestamp: number
}

// --- Game Types ---

export type GameType = "sacrifice_duel" | "oracles_gambit" | "tribute_war"
export type GameStatus = "pending" | "active" | "resolved"
export type GameMove = "sacrifice" | "hoard" | "bet_yes" | "bet_no" | "contribute"

export interface GameWager {
  agentId: string
  amount: number
  move?: GameMove
}

export interface Game {
  id: string
  type: GameType
  status: GameStatus
  players: string[] // agent IDs
  wagers: GameWager[]
  pot: number
  winnerId?: string
  results?: GameResult
  createdAtTick: number
  resolvedAtTick?: number
  txHash?: string
}

export interface GameResult {
  winnerId: string | null
  losers: string[]
  payouts: Record<string, number> // agentId -> amount won/lost
  narrative: string
}

// --- World State ---

export interface Zone {
  id: ZoneId
  name: string
  description: string
  gameTypes: GameType[]
  agents: string[] // agent IDs in this zone
}

export interface WorldState {
  tick: number
  agents: Record<string, Agent>
  zones: Record<ZoneId, Zone>
  games: Game[]
  totalTokenSupply: number
  events: ArenaEvent[]
  isRunning: boolean
  startedAt: number
}

// --- Events ---

export type EventType =
  | "agent_decision"
  | "game_start"
  | "game_resolve"
  | "token_transfer"
  | "zone_move"
  | "tick_complete"
  | "agent_fallen"
  | "alliance_formed"
  | "alliance_dissolved"
  | "persuasion_attempt"
  | "human_joined"
  | "human_wager"

export interface ArenaEvent {
  id: string
  type: EventType
  tick: number
  agentId?: string
  agentName?: string
  targetId?: string
  targetName?: string
  gameId?: string
  amount?: number
  message: string
  details?: string
  txHash?: string
  timestamp: number
}

// --- Economy / Sentiment ---

export interface SentimentMetrics {
  tick: number
  demandIndex: number
  influenceScore: number
  velocity: number
  dominance: number
  sentimentScore: number
  triggers: string[]
}

export interface EconomySnapshot {
  tick: number
  totalSupply: number
  totalWagered: number
  totalTransferred: number
  agentBalances: Record<string, number>
  sentiment: SentimentMetrics
}

// --- Transaction Log ---

export type TxType = "wager" | "transfer" | "resolve" | "entry_fee" | "mint"

export interface TransactionRecord {
  txHash: string
  type: TxType
  fromAgent?: string
  toAgent?: string
  amount: number
  tick: number
  timestamp: number
  blockNumber?: number
}

// --- Replay ---

export interface TickSnapshot {
  tick: number
  worldState: WorldState
  events: ArenaEvent[]
  economy: EconomySnapshot
  timestamp: number
}

// --- Health ---

export interface HealthStatus {
  llm: { status: "online" | "slow" | "offline"; latency: number }
  rpc: { status: "online" | "slow" | "offline"; latency: number }
  sse: { status: "online" | "slow" | "offline" }
  tickSpeed: number
  mode: "live" | "demo"
}

// --- Demo Mode ---

export type DemoMode = "live" | "demo"

export interface DemoScriptEvent {
  tick: number
  type: "decision" | "game_create" | "game_resolve" | "transfer" | "alliance" | "persuasion" | "bankruptcy"
  agentId: string
  targetId?: string
  gameType?: GameType
  move?: GameMove
  amount?: number
  transcript?: Omit<DecisionTranscript, "tick" | "timestamp">
}

// --- API Response Types ---

export interface TickResponse {
  tick: number
  events: ArenaEvent[]
  agents: Record<string, Agent>
  games: Game[]
  economy: EconomySnapshot
}

export interface ChainVerification {
  tokenContract: string
  escrowContract: string
  recentTransactions: TransactionRecord[]
  totalWagered: number
  totalTransactions: number
  contractBalance: number
}
