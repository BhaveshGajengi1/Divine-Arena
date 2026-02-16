import { getWorldState } from "@/lib/world/world-state"
import { getEconomyHistory, getLatestEconomy, getAgentDominance, getTotalWagered, getTotalTransferred } from "@/lib/economy/price-model"
import { getSentimentHistory, getLatestSentiment } from "@/lib/economy/sentiment"

export async function GET() {
  const state = getWorldState()
  const dominance = getAgentDominance(state.agents)

  return Response.json({
    tick: state.tick,
    totalSupply: state.totalTokenSupply,
    totalWagered: getTotalWagered(),
    totalTransferred: getTotalTransferred(),
    dominance,
    sentimentHistory: getSentimentHistory(),
    economyHistory: getEconomyHistory(),
    latestSentiment: getLatestSentiment(),
    latestEconomy: getLatestEconomy(),
  })
}
