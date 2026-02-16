import { parseEther, formatEther, encodeFunctionData, type Hex } from "viem"
import { getWalletClient, publicClient, getServerAddress } from "./monad-client"
import { MONAD_EXPLORER_URL } from "../constants"

// ==========================================
// On-chain Transaction Operations (Monad Testnet)
// ==========================================
// We send tiny native MON transfers as on-chain receipts for every arena action.
// Each tx encodes the arena event type + agent names in the input data calldata
// so it's visible on the explorer. Amount = (in-game token amount) * SCALE_FACTOR
// e.g. 50 in-game tokens = 0.00005 MON sent to self.

const SCALE_FACTOR = 0.000001 // 1 game-token = 0.000001 MON
const TX_QUEUE: Array<{ resolve: (hash: string) => void; reject: (e: unknown) => void; fn: () => Promise<string> }> = []
let processing = false

// Nonce-safe sequential tx sender
async function processQueue() {
  if (processing) return
  processing = true
  while (TX_QUEUE.length > 0) {
    const job = TX_QUEUE.shift()!
    try {
      const hash = await job.fn()
      job.resolve(hash)
    } catch (e) {
      job.reject(e)
    }
  }
  processing = false
}

function enqueue(fn: () => Promise<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    TX_QUEUE.push({ resolve, reject, fn })
    processQueue()
  })
}

/**
 * Send an on-chain receipt for an arena action.
 * Sends a tiny MON transfer to our own address with calldata describing the event.
 */
export async function sendArenaTransaction(opts: {
  type: "wager" | "transfer" | "resolve" | "game_start"
  fromAgent: string
  toAgent?: string
  gameTokenAmount: number
  tick: number
}): Promise<{ txHash: string; explorerUrl: string; blockNumber?: number } | null> {
  const wallet = getWalletClient()
  const address = getServerAddress()
  if (!wallet || !address) {
    console.warn("[monad] No wallet configured, skipping on-chain tx")
    return null
  }

  // Encode event metadata as calldata (hex-encoded UTF-8)
  const memo = `ARENA|${opts.type}|tick:${opts.tick}|${opts.fromAgent}${opts.toAgent ? "->" + opts.toAgent : ""}|amt:${opts.gameTokenAmount}`
  const calldata = stringToHex(memo)

  // Tiny real MON value proportional to game amount
  const monValue = Math.max(opts.gameTokenAmount * SCALE_FACTOR, 0.000001)

  return enqueue(async () => {
    try {
      const hash = await wallet.sendTransaction({
        to: address as `0x${string}`,
        value: parseEther(monValue.toFixed(18)),
        data: calldata as Hex,
      })

      // Wait for receipt (non-blocking, best effort)
      let blockNumber: number | undefined
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 8_000,
        })
        blockNumber = Number(receipt.blockNumber)
      } catch {
        // tx submitted but receipt not yet available — that's OK
      }

      const explorerUrl = `${MONAD_EXPLORER_URL}/tx/${hash}`
      console.log(`[monad] Tx sent: ${explorerUrl}`)

      return JSON.stringify({ txHash: hash, explorerUrl, blockNumber })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[monad] Tx failed: ${message}`)
      throw err
    }
  }).then((raw) => JSON.parse(raw))
}

/**
 * Read the current server wallet balance (MON on testnet).
 */
export async function getWalletBalance(): Promise<string> {
  const address = getServerAddress()
  if (!address) return "0"
  try {
    const bal = await publicClient.getBalance({ address: address as `0x${string}` })
    return formatEther(bal)
  } catch {
    return "0"
  }
}

// Simple string -> 0x hex
function stringToHex(str: string): string {
  let hex = "0x"
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0")
  }
  return hex
}
