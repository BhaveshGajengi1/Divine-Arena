import { NextRequest } from "next/server"
import { getReplayTimeline, getStateAtTick } from "@/lib/replay/replay-engine"

export async function GET(req: NextRequest) {
  const tick = req.nextUrl.searchParams.get("tick")

  if (tick) {
    const state = getStateAtTick(parseInt(tick))
    if (!state) {
      return Response.json({ error: "Tick not found" }, { status: 404 })
    }
    return Response.json(state)
  }

  const timeline = getReplayTimeline()
  return Response.json(timeline)
}
