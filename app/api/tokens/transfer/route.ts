import { NextRequest } from "next/server"
import { getWorldState, getActiveAgents, updateAgentBalance, addEvent } from "@/lib/world/world-state"
import { addTransaction } from "@/lib/blockchain/tx-log"
import { sendArenaTransaction } from "@/lib/blockchain/token-operations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const forced = body.forced as boolean

    if (forced) {
      // Pick two random active agents and transfer tokens
      const agents = getActiveAgents().filter((a) => !a.isHuman && a.balance > 50)
      if (agents.length < 2) {
        return Response.json({ error: "Not enough agents with sufficient balance" }, { status: 400 })
      }

      const shuffled = [...agents].sort(() => Math.random() - 0.5)
      const [from, to] = shuffled
      const amount = Math.min(50, Math.floor(from.balance * 0.1))

      updateAgentBalance(from.id, -amount)
      updateAgentBalance(to.id, amount)

      const state = getWorldState()
      let txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`

      // Send real on-chain tx
      try {
        const receipt = await sendArenaTransaction({
          type: "transfer",
          fromAgent: from.persona.name,
          toAgent: to.persona.name,
          gameTokenAmount: amount,
          tick: state.tick,
        })
        if (receipt) txHash = receipt.txHash
      } catch { /* chain tx failed, use mock hash */ }

      addEvent({
        id: `evt_transfer_${Date.now()}`,
        type: "token_transfer",
        tick: state.tick,
        agentId: from.id,
        agentName: from.persona.name,
        targetId: to.id,
        targetName: to.persona.name,
        amount,
        message: `[FORCED] ${from.persona.name} transfers ${amount} tokens to ${to.persona.name}`,
        txHash,
        timestamp: Date.now(),
      })

      addTransaction({
        txHash,
        type: "transfer",
        fromAgent: from.persona.name,
        toAgent: to.persona.name,
        amount,
        tick: state.tick,
        timestamp: Date.now(),
      })

      return Response.json({ from: from.persona.name, to: to.persona.name, amount, txHash })
    }

    return Response.json({ error: "Non-forced transfers not yet implemented" }, { status: 400 })
  } catch (error) {
    console.error("Transfer error:", error)
    return Response.json({ error: "Failed to transfer tokens" }, { status: 500 })
  }
}
