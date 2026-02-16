import { getRecentTransactions, getTotalWageredOnChain, getTotalTransactionCount } from "@/lib/blockchain/tx-log"
import { getServerAddress } from "@/lib/blockchain/monad-client"
import { getWalletBalance } from "@/lib/blockchain/token-operations"
import { MONAD_EXPLORER_URL } from "@/lib/constants"

export async function GET() {
  const address = getServerAddress()
  let balance = "0"
  try {
    balance = await getWalletBalance()
  } catch {
    // chain unreachable
  }

  const txs = getRecentTransactions(20).map((tx) => ({
    ...tx,
    explorerUrl: tx.txHash.startsWith("0x") && tx.txHash.length === 66
      ? `${MONAD_EXPLORER_URL}/tx/${tx.txHash}`
      : null,
  }))

  return Response.json({
    network: "Monad Testnet",
    chainId: 10143,
    explorerUrl: MONAD_EXPLORER_URL,
    serverWallet: address,
    walletBalance: balance,
    walletExplorerUrl: address ? `${MONAD_EXPLORER_URL}/address/${address}` : null,
    recentTransactions: txs,
    totalWagered: getTotalWageredOnChain(),
    totalTransactions: getTotalTransactionCount(),
  })
}
