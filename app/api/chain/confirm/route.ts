import { NextRequest } from "next/server"
import { addTransaction } from "@/lib/blockchain/tx-log"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { txHash, type, fromAgent, toAgent, amount, tick, userWallet } = body

    if (!txHash || !type) {
      return Response.json({ error: "Missing txHash or type" }, { status: 400 })
    }

    addTransaction({
      txHash,
      type: type || "wager",
      fromAgent: fromAgent || undefined,
      toAgent: toAgent || undefined,
      amount: amount || 0,
      tick: tick || 0,
      timestamp: Date.now(),
    })

    return Response.json({
      success: true,
      txHash,
      userWallet,
      message: "Transaction recorded on-chain",
    })
  } catch {
    return Response.json({ error: "Failed to record transaction" }, { status: 500 })
  }
}
