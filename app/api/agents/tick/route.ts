import { NextRequest } from "next/server"
import { runTick, forceGameCreation } from "@/lib/world/simulation"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode || "demo"
    const forcedEvent = body.event as "persuasion" | "alliance" | undefined
    const forceGame = body.forceGame as boolean | undefined
    const forceResolve = body.forceResolve as boolean | undefined

    if (forceGame) {
      const gameType = body.gameType || "sacrifice_duel"
      const result = await forceGameCreation(gameType, mode)
      return Response.json(result)
    }

    const result = await runTick(mode, forcedEvent)
    return Response.json(result)
  } catch (error) {
    console.error("Tick error:", error)
    return Response.json({ error: "Simulation tick failed" }, { status: 500 })
  }
}
