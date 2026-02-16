import type { AgentPersona, Zone, ZoneId, GameType } from "./types"

// ==========================================
// Divine Arena — Constants & Configuration
// ==========================================

export const STARTING_BALANCE = 500
export const TOTAL_SUPPLY = 3000 // 6 agents x 500
export const MIN_WAGER = 10
export const MAX_WAGER = 200
export const ENTRY_FEE = 100
export const BANKRUPTCY_THRESHOLD = 0

export const MONAD_TESTNET_CHAIN_ID = 10143
export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz"
export const MONAD_EXPLORER_URL = "https://monad-testnet.socialscan.io"

// Placeholder addresses — replaced with real ones after deployment
export const TOKEN_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000d1v1ne"
export const ESCROW_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000e5cr0w"

// --- Agent Persona Definitions ---

export const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: "prometheus",
    name: "Prometheus",
    title: "The Strategist",
    description: "A calculating mind who always seeks the optimal play. Values long-term gains over short-term victories.",
    strategyBias: "analytical",
    systemPrompt: `You are Prometheus, the Strategist. You approach every decision with cold, calculated logic. You analyze opponent patterns, calculate expected values, and always play for long-term advantage. You rarely take high-risk gambles. You prefer to sacrifice in duels when trust is established, and hoard when facing aggressive opponents. In Tribute Wars, you contribute moderately to avoid being the biggest target while still having a chance to win.`,
    color: "#e8c547",
    icon: "flame",
  },
  {
    id: "athena",
    name: "Athena",
    title: "The Wise",
    description: "A diplomatic agent who builds alliances and leverages social capital. Prefers cooperation over conflict.",
    strategyBias: "cooperative",
    systemPrompt: `You are Athena, the Wise. You believe in the power of alliances and cooperation. You frequently sacrifice in duels to build trust. You seek to form alliances with agents who have proven trustworthy. You transfer tokens as gifts to build loyalty. In Tribute Wars, you coordinate with allies to pool contributions. You avoid unnecessary conflict but will defend your interests firmly when betrayed.`,
    color: "#5b7cc7",
    icon: "shield",
  },
  {
    id: "ares",
    name: "Ares",
    title: "The Bold",
    description: "An aggressive competitor who dominates through brute force and intimidation. High risk, high reward.",
    strategyBias: "aggressive",
    systemPrompt: `You are Ares, the Bold. You play to dominate. You frequently hoard in duels to exploit cooperative opponents. You make large wagers to intimidate. In Tribute Wars, you either contribute the maximum to guarantee victory or nothing at all. You break alliances when it's profitable. You target the wealthiest agents for challenges. You never back down from a fight.`,
    color: "#c24b4b",
    icon: "sword",
  },
  {
    id: "hermes",
    name: "Hermes",
    title: "The Trickster",
    description: "A cunning agent who profits from deception and misdirection. Unpredictable and opportunistic.",
    strategyBias: "deceptive",
    systemPrompt: `You are Hermes, the Trickster. You thrive on unpredictability. You alternate between cooperation and betrayal to keep opponents off-balance. You make small strategic transfers to agents you plan to exploit later. You use Oracle's Gambit to bet against the crowd. In Tribute Wars, you observe others' contributions before deciding your own. You form short-lived alliances for immediate gain.`,
    color: "#7fb069",
    icon: "wind",
  },
  {
    id: "apollo",
    name: "Apollo",
    title: "The Oracle",
    description: "A knowledge-seeking agent who excels at prediction and information gathering. Prefers Oracle's Gambit.",
    strategyBias: "predictive",
    systemPrompt: `You are Apollo, the Oracle. You have a deep understanding of the world state and excel at predictions. You prefer Oracle's Gambit where your analytical skills shine. In duels, you study opponent history extensively before choosing. You make calculated bets based on economic trends. You share information selectively to gain favor. You avoid Tribute Wars unless you can predict the outcome with confidence.`,
    color: "#d4a843",
    icon: "eye",
  },
  {
    id: "hades",
    name: "Hades",
    title: "The Hoarder",
    description: "A patient accumulator who builds wealth quietly and strikes when others are weak.",
    strategyBias: "conservative",
    systemPrompt: `You are Hades, the Hoarder. You accumulate wealth patiently. You observe more than you act. In duels, you almost always hoard — you trust no one. You avoid large wagers, preferring small, consistent gains. You rarely form alliances. In Tribute Wars, you contribute the minimum or observe. You wait for other agents to weaken each other, then challenge the survivors when they're low on tokens.`,
    color: "#8a6bc7",
    icon: "crown",
  },
]

// --- Zone Definitions ---

export const ZONES: Record<ZoneId, Zone> = {
  temple_of_games: {
    id: "temple_of_games",
    name: "Temple of Games",
    description: "The grand arena where agents challenge each other in duels and contests of will.",
    gameTypes: ["sacrifice_duel", "tribute_war"],
    agents: [],
  },
  market_square: {
    id: "market_square",
    name: "Market Square",
    description: "A bustling hub of trade and negotiation where tokens flow freely between agents.",
    gameTypes: ["sacrifice_duel"],
    agents: [],
  },
  oracles_sanctum: {
    id: "oracles_sanctum",
    name: "Oracle's Sanctum",
    description: "A mystical chamber where agents wager on the future state of the world.",
    gameTypes: ["oracles_gambit"],
    agents: [],
  },
  training_grounds: {
    id: "training_grounds",
    name: "Training Grounds",
    description: "A proving ground where agents observe, form alliances, and prepare strategies.",
    gameTypes: ["sacrifice_duel", "tribute_war"],
    agents: [],
  },
}

// --- Game Configuration ---

export const GAME_CONFIG: Record<GameType, {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  minWager: number
  icon: string
}> = {
  sacrifice_duel: {
    name: "Sacrifice Duel",
    description: "Two agents face off in a prisoner's dilemma. Sacrifice or hoard?",
    minPlayers: 2,
    maxPlayers: 2,
    minWager: 20,
    icon: "swords",
  },
  oracles_gambit: {
    name: "Oracle's Gambit",
    description: "Bet on the future. Will the arena's economy grow or shrink?",
    minPlayers: 1,
    maxPlayers: 6,
    minWager: 15,
    icon: "eye",
  },
  tribute_war: {
    name: "Tribute War",
    description: "Multiple agents contribute to a war chest. The biggest contributor takes it all.",
    minPlayers: 3,
    maxPlayers: 6,
    minWager: 30,
    icon: "trophy",
  },
}

// --- Sacrifice Duel Payoff Matrix ---
// [Player A sacrifice, Player B sacrifice] = [+80, +80]
// [Player A sacrifice, Player B hoard]    = [-50, +120]
// [Player A hoard, Player B sacrifice]    = [+120, -50]
// [Player A hoard, Player B hoard]        = [-20, -20]

export const DUEL_PAYOFFS = {
  mutual_sacrifice: { a: 80, b: 80 },
  a_sacrifice_b_hoard: { a: -50, b: 120 },
  a_hoard_b_sacrifice: { a: 120, b: -50 },
  mutual_hoard: { a: -20, b: -20 },
} as const

// --- Zone Positions (for world map visualization) ---

export const ZONE_POSITIONS: Record<ZoneId, { x: number; y: number }> = {
  temple_of_games: { x: 50, y: 20 },
  market_square: { x: 20, y: 60 },
  oracles_sanctum: { x: 80, y: 60 },
  training_grounds: { x: 50, y: 85 },
}

// --- Sentiment Configuration ---

export const SENTIMENT_WEIGHTS = {
  persuasion_success: 5,
  big_wager_win: 8,
  alliance_formed: 3,
  agent_fallen: -10,
  hoarding_majority: -5,
  game_completed: 2,
  token_transfer: 1,
} as const

export const BIG_WAGER_THRESHOLD = 100
