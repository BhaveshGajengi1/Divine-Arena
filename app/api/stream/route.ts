import { getWorldState } from "@/lib/world/world-state"
import { getLastTickSpeed } from "@/lib/world/simulation"
import { getLatestEconomy } from "@/lib/economy/price-model"
import { getRecentTransactions } from "@/lib/blockchain/tx-log"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  let lastTick = 0
  let lastEventCount = 0
  let alive = true

  const stream = new ReadableStream({
    start(controller) {
      const send = (eventType: string, data: unknown) => {
        if (!alive) return
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          alive = false
        }
      }

      // Send initial snapshot
      const state = getWorldState()
      lastTick = state.tick
      lastEventCount = state.events.length
      send("init", {
        tick: state.tick,
        agents: state.agents,
        games: state.games.slice(-20),
        events: state.events.slice(-30),
      })

      // Poll world state every 400ms and push diffs
      const interval = setInterval(() => {
        if (!alive) {
          clearInterval(interval)
          return
        }
        try {
          const current = getWorldState()

          // Tick changed => full state push with economy
          if (current.tick !== lastTick) {
            lastTick = current.tick
            const economy = getLatestEconomy()
            const txs = getRecentTransactions(20)
            send("tick", {
              tick: current.tick,
              agents: current.agents,
              games: current.games.slice(-20),
              tickSpeed: getLastTickSpeed(),
              economy: economy || null,
              transactions: txs,
            })
          }

          // New events since last check
          if (current.events.length > lastEventCount) {
            const newEvents = current.events.slice(lastEventCount)
            send("events", newEvents)
            lastEventCount = current.events.length
          }

          // Heartbeat every cycle to keep connection alive
          send("heartbeat", { t: Date.now() })
        } catch {
          alive = false
          clearInterval(interval)
          try { controller.close() } catch { /* noop */ }
        }
      }, 400)

      // Auto-close after 10 minutes
      setTimeout(() => {
        alive = false
        clearInterval(interval)
        try { controller.close() } catch { /* noop */ }
      }, 10 * 60 * 1000)
    },
    cancel() {
      alive = false
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
