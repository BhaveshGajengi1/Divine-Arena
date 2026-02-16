import { createPublicClient, createWalletClient, http, defineChain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { MONAD_RPC_URL, MONAD_TESTNET_CHAIN_ID } from "../constants"

// ==========================================
// Monad Testnet Client (viem)
// ==========================================

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "SocialScan", url: "https://monad-testnet.socialscan.io" },
  },
  testnet: true,
})

// Server wallet — signs all arena transactions
function getServerAccount() {
  const key = process.env.MONAD_PRIVATE_KEY
  if (!key) return null
  const formatted = key.startsWith("0x") ? key : `0x${key}`
  return privateKeyToAccount(formatted as `0x${string}`)
}

// Public client for reading chain state
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_URL),
})

// Wallet client for sending transactions
export function getWalletClient() {
  const account = getServerAccount()
  if (!account) return null
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(MONAD_RPC_URL),
  })
}

export function getServerAddress(): string | null {
  const account = getServerAccount()
  return account?.address || null
}

export async function getServerBalance(): Promise<bigint> {
  const address = getServerAddress()
  if (!address) return 0n
  try {
    return await publicClient.getBalance({ address: address as `0x${string}` })
  } catch {
    return 0n
  }
}

export async function isChainReachable(): Promise<boolean> {
  try {
    await publicClient.getChainId()
    return true
  } catch {
    return false
  }
}
