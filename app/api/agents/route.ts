import { getWorldState } from "@/lib/world/world-state"

export async function GET() {
  const state = getWorldState()
  return Response.json({
    agents: state.agents,
    tick: state.tick,
  })
}
