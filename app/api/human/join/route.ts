import { NextRequest } from "next/server"
import { addHumanPlayer, addEvent, getWorldState } from "@/lib/world/world-state"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, walletAddress } = body

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    const agent = addHumanPlayer(name, walletAddress || "0x0000")
    const state = getWorldState()

    addEvent({
      id: `evt_human_${Date.now()}`,
      type: "human_joined",
      tick: state.tick,
      agentId: agent.id,
      agentName: name,
      message: `${name} has entered the Divine Arena as a human champion!`,
      timestamp: Date.now(),
    })

    return Response.json({ agent, tick: state.tick })
  } catch (error) {
    console.error("Human join error:", error)
    return Response.json({ error: "Failed to join arena" }, { status: 500 })
  }
}
