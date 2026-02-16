import { NextRequest } from "next/server"
import { getWorldState, resetWorldState } from "@/lib/world/world-state"
import { resetEconomy } from "@/lib/economy/price-model"
import { resetSentiment } from "@/lib/economy/sentiment"
import { clearEventLog } from "@/lib/world/event-log"
import { clearTransactionLog } from "@/lib/blockchain/tx-log"

export async function GET() {
  const state = getWorldState()
  return Response.json({
    tick: state.tick,
    zones: state.zones,
    agents: state.agents,
    games: state.games.slice(-20),
    events: state.events.slice(-50),
    totalTokenSupply: state.totalTokenSupply,
    isRunning: state.isRunning,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.action === "reset") {
      resetWorldState()
      resetEconomy()
      resetSentiment()
      clearEventLog()
      clearTransactionLog()
      const state = getWorldState()
      return Response.json({
        tick: state.tick,
        agents: state.agents,
        zones: state.zones,
        message: "Arena reset successfully",
      })
    }
    return Response.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Arena POST error:", error)
    return Response.json({ error: "Failed to process arena action" }, { status: 500 })
  }
}
