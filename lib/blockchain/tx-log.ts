import type { TransactionRecord, TxType } from "../types"

// ==========================================
// In-Memory Transaction Log
// ==========================================

const transactions: TransactionRecord[] = []

export function addTransaction(tx: TransactionRecord): void {
  transactions.push(tx)
}

export function getRecentTransactions(limit = 20): TransactionRecord[] {
  return transactions.slice(-limit).reverse()
}

export function getAllTransactions(): TransactionRecord[] {
  return transactions
}

export function getTotalWageredOnChain(): number {
  return transactions
    .filter((tx) => tx.type === "wager")
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export function getTotalTransactionCount(): number {
  return transactions.length
}

export function getTransactionsByType(type: TxType): TransactionRecord[] {
  return transactions.filter((tx) => tx.type === type)
}

export function clearTransactionLog(): void {
  transactions.length = 0
}
