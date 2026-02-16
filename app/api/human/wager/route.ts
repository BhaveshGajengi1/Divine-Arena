import { NextRequest } from "next/server"
import { getWorldState, getAgent } from "@/lib/world/world-state"
import { getGameById, resolveGame } from "@/lib/agents/game-logic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, gameId, amount, move } = body

    const agent = getAgent(agentId)
    if (!agent || !agent.isHuman) {
      return Response.json({ error: "Human agent not found" }, { status: 400 })
    }

    const game = getGameById(gameId)
    if (!game || game.status !== "active") {
      return Response.json({ error: "Game not found or not active" }, { status: 400 })
    }

    // Add human wager to game
    game.wagers.push({ agentId, amount: Math.min(amount, agent.balance), move })
    game.pot += Math.min(amount, agent.balance)

    // Try to resolve if all players have moved
    const allMoved = game.wagers.every((w) => w.move)
    if (allMoved) {
      const result = resolveGame(game.id)
      return Response.json({ game, result, resolved: true })
    }

    return Response.json({ game, resolved: false })
  } catch (error) {
    console.error("Human wager error:", error)
    return Response.json({ error: "Failed to place wager" }, { status: 500 })
  }
}
