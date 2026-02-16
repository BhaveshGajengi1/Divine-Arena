import { getLastTickSpeed } from "@/lib/world/simulation"

export async function GET() {
  const tickSpeed = getLastTickSpeed()

  // Check LLM availability
  let llmStatus: "online" | "slow" | "offline" = "offline"
  let llmLatency = 0
  try {
    const start = Date.now()
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}` },
      signal: AbortSignal.timeout(5000),
    })
    llmLatency = Date.now() - start
    llmStatus = res.ok ? (llmLatency > 2000 ? "slow" : "online") : "offline"
  } catch {
    llmStatus = "offline"
  }

  // Check Monad RPC
  let rpcStatus: "online" | "slow" | "offline" = "offline"
  let rpcLatency = 0
  try {
    const start = Date.now()
    const res = await fetch("https://testnet-rpc.monad.xyz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    })
    rpcLatency = Date.now() - start
    rpcStatus = res.ok ? (rpcLatency > 2000 ? "slow" : "online") : "offline"
  } catch {
    rpcStatus = "offline"
  }

  return Response.json({
    llm: { status: llmStatus, latency: llmLatency },
    rpc: { status: rpcStatus, latency: rpcLatency },
    sse: { status: "online" }, // SSE health is client-side
    tickSpeed,
    mode: process.env.OPENAI_API_KEY ? "live" : "demo",
  })
}
