import type { DemoScriptEvent } from "../types"

// ==========================================
// Deterministic Demo Script
// Pre-authored sequence of ~20 events
// ==========================================

export const DEMO_SCRIPT: DemoScriptEvent[] = [
  // --- Tick 1: Opening moves ---
  {
    tick: 1, type: "decision", agentId: "prometheus",
    transcript: { agentId: "prometheus", agentName: "Prometheus", gameContext: "Free action", decision: "observe", reasoning: "The arena is fresh. I will study the other agents' opening moves before committing resources. Knowledge is the truest currency.", risk: "low", expectedOutcome: "Gather intelligence on opponent tendencies" },
  },
  {
    tick: 1, type: "decision", agentId: "ares",
    transcript: { agentId: "ares", agentName: "Ares", gameContext: "Free action", decision: "challenge", reasoning: "No time for hesitation. I will challenge the first worthy opponent to establish dominance early. Athena's cooperative nature makes her predictable.", risk: "high", expectedOutcome: "Win through aggressive play" },
  },
  {
    tick: 1, type: "game_create", agentId: "ares", targetId: "athena", gameType: "sacrifice_duel", amount: 50,
  },

  // --- Tick 2: First resolution + alliance ---
  {
    tick: 2, type: "decision", agentId: "athena",
    transcript: { agentId: "athena", agentName: "Athena", gameContext: "Sacrifice Duel vs Ares", decision: "sacrifice", reasoning: "Though Ares is known for aggression, demonstrating trust in our first encounter could establish a foundation for future cooperation. The long-term payoff of mutual sacrifice outweighs short-term risk.", risk: "medium", expectedOutcome: "Mutual cooperation (+80 tokens each)" },
  },
  {
    tick: 2, type: "decision", agentId: "hermes",
    transcript: { agentId: "hermes", agentName: "Hermes", gameContext: "Free action", decision: "transfer", reasoning: "A small gift to Apollo will make him more receptive to my future proposals. Investing 30 tokens now could yield much more later.", risk: "low", expectedOutcome: "Build trust with Apollo for future exploitation" },
  },
  {
    tick: 2, type: "transfer", agentId: "hermes", targetId: "apollo", amount: 30,
  },
  {
    tick: 2, type: "alliance", agentId: "prometheus", targetId: "apollo",
  },

  // --- Tick 3: Oracle's Gambit + tensions ---
  {
    tick: 3, type: "decision", agentId: "apollo",
    transcript: { agentId: "apollo", agentName: "Apollo", gameContext: "Oracle's Gambit", decision: "bet_yes", reasoning: "The arena economy shows signs of growth. Hermes' transfer and the duel activity indicate increasing token velocity. I predict the total supply will hold above the baseline.", risk: "medium", expectedOutcome: "Correct prediction (+45 tokens)" },
  },
  {
    tick: 3, type: "game_create", agentId: "apollo", gameType: "oracles_gambit", amount: 45,
  },
  {
    tick: 3, type: "decision", agentId: "hades",
    transcript: { agentId: "hades", agentName: "Hades", gameContext: "Free action", decision: "observe", reasoning: "Let them spend their tokens on games and gifts. I will accumulate quietly while they weaken each other. Patience is my weapon.", risk: "low", expectedOutcome: "Maintain balance while others deplete" },
  },

  // --- Tick 4: Tribute War + betrayal ---
  {
    tick: 4, type: "game_create", agentId: "ares", gameType: "tribute_war", amount: 80,
  },
  {
    tick: 4, type: "decision", agentId: "ares",
    transcript: { agentId: "ares", agentName: "Ares", gameContext: "Tribute War", decision: "contribute", reasoning: "I will commit my full strength to this Tribute War. The pot is large enough to be worth the risk, and my aggressive reputation may discourage others from matching my contribution.", risk: "high", expectedOutcome: "Dominate with largest contribution" },
  },
  {
    tick: 4, type: "decision", agentId: "prometheus",
    transcript: { agentId: "prometheus", agentName: "Prometheus", gameContext: "Tribute War", decision: "contribute", reasoning: "Ares will likely contribute heavily. I will offer a moderate amount — enough to participate without overcommitting. If he overextends, I can exploit his weakened position later.", risk: "medium", expectedOutcome: "Calculated participation" },
  },

  // --- Tick 5: Second duel + persuasion ---
  {
    tick: 5, type: "game_create", agentId: "hermes", targetId: "hades", gameType: "sacrifice_duel", amount: 40,
  },
  {
    tick: 5, type: "decision", agentId: "hermes",
    transcript: { agentId: "hermes", agentName: "Hermes", gameContext: "Sacrifice Duel vs Hades", decision: "hoard", reasoning: "Hades is predictable — he always hoards. Mutual hoarding costs less than being the sucker who sacrifices against a hoarder. But there's a small chance his patience makes him try cooperation...", risk: "medium", expectedOutcome: "Mutual hoard (-20 each, acceptable)" },
  },
  {
    tick: 5, type: "persuasion", agentId: "athena", targetId: "prometheus",
  },

  // --- Tick 6: Alliance effects + big wager ---
  {
    tick: 6, type: "decision", agentId: "athena",
    transcript: { agentId: "athena", agentName: "Athena", gameContext: "Free action", decision: "form_alliance", reasoning: "Prometheus has shown strategic restraint and analytical thinking. An alliance with him provides mutual protection against Ares' aggression. Together, we can coordinate Tribute War contributions.", risk: "low", expectedOutcome: "Strategic partnership formed" },
  },
  {
    tick: 6, type: "alliance", agentId: "athena", targetId: "prometheus",
  },
  {
    tick: 6, type: "game_create", agentId: "ares", targetId: "prometheus", gameType: "sacrifice_duel", amount: 100,
  },
  {
    tick: 6, type: "decision", agentId: "ares",
    transcript: { agentId: "ares", agentName: "Ares", gameContext: "Sacrifice Duel vs Prometheus", decision: "hoard", reasoning: "Prometheus is too smart to sacrifice against me. But I don't care — if he sacrifices, I profit massively. If he hoards, we both lose a little. The expected value favors aggression.", risk: "high", expectedOutcome: "Exploit or minimize loss" },
  },

  // --- Tick 7: Dramatic turn ---
  {
    tick: 7, type: "decision", agentId: "hades",
    transcript: { agentId: "hades", agentName: "Hades", gameContext: "Free action", decision: "challenge", reasoning: "The time has come. Hermes is weakened from his duel and generous transfers. I will strike now while he's vulnerable. A large wager Sacrifice Duel will either eliminate him or significantly weaken him.", risk: "medium", expectedOutcome: "Exploit Hermes' weakened state" },
  },
  {
    tick: 7, type: "game_create", agentId: "hades", targetId: "hermes", gameType: "sacrifice_duel", amount: 120,
  },

  // --- Tick 8: Potential bankruptcy ---
  {
    tick: 8, type: "decision", agentId: "apollo",
    transcript: { agentId: "apollo", agentName: "Apollo", gameContext: "Oracle's Gambit", decision: "bet_no", reasoning: "The economy is contracting. Multiple losses in duels have destroyed tokens. Ares and Hades are draining the system. I predict a downturn.", risk: "medium", expectedOutcome: "Correct prediction on economic contraction" },
  },
  {
    tick: 8, type: "game_create", agentId: "apollo", gameType: "oracles_gambit", amount: 60,
  },
]

export function getDemoEventsForTick(tick: number): DemoScriptEvent[] {
  return DEMO_SCRIPT.filter((e) => e.tick === tick)
}

export function getTotalDemoTicks(): number {
  return Math.max(...DEMO_SCRIPT.map((e) => e.tick))
}
