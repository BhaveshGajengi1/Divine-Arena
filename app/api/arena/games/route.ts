import { NextRequest } from "next/server"
import { getActiveGames, getRecentGames } from "@/lib/agents/game-logic"
import { forceGameCreation } from "@/lib/world/simulation"

export async function GET() {
  return Response.json({
    active: getActiveGames(),
    recent: getRecentGames(20),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mode = body.mode || "demo"
    const gameType = body.type || "sacrifice_duel"

    const result = await forceGameCreation(gameType, mode)
    return Response.json(result)
  } catch (error) {
    console.error("Game creation error:", error)
    return Response.json({ error: "Failed to create game" }, { status: 500 })
  }
}
