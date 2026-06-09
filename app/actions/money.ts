'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { moneyAccounts, moneyTransactions, ccBills } from '@/lib/db/schema'
import { and, eq, desc, gte, lte, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { addDays } from 'date-fns'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAccounts() {
  const userId = await getUserId()
  return db
    .select()
    .from(moneyAccounts)
    .where(and(eq(moneyAccounts.userId, userId), eq(moneyAccounts.isActive, true)))
    .orderBy(moneyAccounts.createdAt)
}

export async function seedDefaultAccounts() {
  const userId = await getUserId()
  const existing = await db
    .select()
    .from(moneyAccounts)
    .where(eq(moneyAccounts.userId, userId))

  if (existing.length > 0) return existing

  // Insert the 5 default accounts for this user
  const defaults = [
    {
      userId,
      name: 'Flipkart Axis Bank',
      type: 'credit_card' as const,
      balance: '0',
      creditLimit: '19000',
      billingCycleDay: 13,  // bill generates on 13th
      dueDateDay: 26,        // due on 26th
      dueDaysAfterBill: null,
      color: '#f97316',
      icon: 'credit-card',
    },
    {
      userId,
      name: 'Roar Bank',
      type: 'credit_card' as const,
      balance: '0',
      creditLimit: '5000',
      billingCycleDay: 1,   // bill generates on 1st
      dueDateDay: null,
      dueDaysAfterBill: 15, // due 15 days after bill
      color: '#8b5cf6',
      icon: 'credit-card',
    },
    {
      userId,
      name: 'Kotak Bank',
      type: 'bank_account' as const,
      balance: '0',
      creditLimit: null,
      billingCycleDay: null,
      dueDateDay: null,
      dueDaysAfterBill: null,
      color: '#ef4444',
      icon: 'landmark',
    },
    {
      userId,
      name: 'Indie Bank',
      type: 'bank_account' as const,
      balance: '0',
      creditLimit: null,
      billingCycleDay: null,
      dueDateDay: null,
      dueDaysAfterBill: null,
      color: '#06b6d4',
      icon: 'landmark',
    },
    {
      userId,
      name: 'Cash',
      type: 'cash' as const,
      balance: '0',
      creditLimit: null,
      billingCycleDay: null,
      dueDateDay: null,
      dueDaysAfterBill: null,
      color: '#22c55e',
      icon: 'banknote',
    },
  ]

  const created = await db.insert(moneyAccounts).values(defaults).returning()
  revalidatePath('/money')
  return created
}

export async function saveCustomAccounts(
  accountsData: {
    name: string
    type: 'credit_card' | 'bank_account' | 'cash'
    balance: string
    creditLimit?: string | null
    billingCycleDay?: number | null
    dueDateDay?: number | null
    dueDaysAfterBill?: number | null
    color?: string
    icon?: string
  }[]
) {
  const userId = await getUserId()
  const values = accountsData.map(acc => ({
    userId,
    name: acc.name,
    type: acc.type,
    balance: acc.balance,
    creditLimit: acc.creditLimit || null,
    billingCycleDay: acc.billingCycleDay || null,
    dueDateDay: acc.dueDateDay || null,
    dueDaysAfterBill: acc.dueDaysAfterBill || null,
    color: acc.color || '#6366f1',
    icon: acc.icon || 'credit-card',
  }))
  const created = await db.insert(moneyAccounts).values(values).returning()
  revalidatePath('/money')
  return created
}

export async function updateAccount(
  id: number,
  data: {
    name?: string
    balance?: string
    creditLimit?: string
    billingCycleDay?: number
    dueDateDay?: number | null
    dueDaysAfterBill?: number | null
    color?: string
  }
) {
  const userId = await getUserId()
  const [account] = await db
    .update(moneyAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(moneyAccounts.id, id), eq(moneyAccounts.userId, userId)))
    .returning()
  revalidatePath('/money')
  return account
}

// ─── Transactions ──────────────────────────────────────────────────────────────

export async function getTransactions(filters?: {
  accountId?: number
  category?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
}) {
  const userId = await getUserId()
  const conditions = [eq(moneyTransactions.userId, userId)]

  if (filters?.accountId) {
    conditions.push(eq(moneyTransactions.accountId, filters.accountId))
  }
  if (filters?.category) {
    conditions.push(eq(moneyTransactions.category, filters.category))
  }
  if (filters?.fromDate) {
    conditions.push(gte(moneyTransactions.transactionDate, filters.fromDate))
  }
  if (filters?.toDate) {
    conditions.push(lte(moneyTransactions.transactionDate, filters.toDate))
  }

  return db
    .select({
      id: moneyTransactions.id,
      userId: moneyTransactions.userId,
      accountId: moneyTransactions.accountId,
      amount: moneyTransactions.amount,
      type: moneyTransactions.type,
      category: moneyTransactions.category,
      merchant: moneyTransactions.merchant,
      description: moneyTransactions.description,
      notes: moneyTransactions.notes,
      transactionDate: moneyTransactions.transactionDate,
      createdAt: moneyTransactions.createdAt,
      accountName: moneyAccounts.name,
      accountColor: moneyAccounts.color,
      accountType: moneyAccounts.type,
    })
    .from(moneyTransactions)
    .leftJoin(moneyAccounts, eq(moneyTransactions.accountId, moneyAccounts.id))
    .where(and(...conditions))
    .orderBy(desc(moneyTransactions.transactionDate))
    .limit(filters?.limit ?? 200)
}

export async function createTransaction(data: {
  accountId: number
  amount: string
  type: string
  category: string
  merchant?: string
  description?: string
  notes?: string
  transactionDate: Date
}) {
  const userId = await getUserId()

  // Update account balance
  const account = await db
    .select()
    .from(moneyAccounts)
    .where(and(eq(moneyAccounts.id, data.accountId), eq(moneyAccounts.userId, userId)))
    .then(r => r[0])

  if (!account) throw new Error('Account not found')

  const currentBalance = parseFloat(account.balance ?? '0')
  const amount = parseFloat(data.amount)
  let newBalance = currentBalance

  if (data.type === 'debit') {
    newBalance = currentBalance + amount  // CC: spending increases balance used
    if (account.type === 'bank_account' || account.type === 'cash') {
      newBalance = currentBalance - amount  // Bank/cash: spending decreases balance
    }
  } else {
    newBalance = currentBalance - amount  // CC: payment decreases balance used
    if (account.type === 'bank_account' || account.type === 'cash') {
      newBalance = currentBalance + amount  // Bank/cash: income increases balance
    }
  }

  const [txn] = await db
    .insert(moneyTransactions)
    .values({ ...data, userId })
    .returning()

  await db
    .update(moneyAccounts)
    .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
    .where(eq(moneyAccounts.id, data.accountId))

  // Auto-create or update CC bill
  if (account.type === 'credit_card') {
    await upsertCCBill(userId, account, data.transactionDate)
  }

  revalidatePath('/money')
  return txn
}

export async function updateTransaction(
  id: number,
  data: {
    amount?: string
    type?: string
    category?: string
    merchant?: string
    description?: string
    notes?: string
    transactionDate?: Date
  }
) {
  const userId = await getUserId()

  // Get old transaction to reverse balance effect
  const [oldTxn] = await db
    .select()
    .from(moneyTransactions)
    .where(and(eq(moneyTransactions.id, id), eq(moneyTransactions.userId, userId)))

  if (!oldTxn) throw new Error('Transaction not found')

  // Get account
  const [account] = await db
    .select()
    .from(moneyAccounts)
    .where(eq(moneyAccounts.id, oldTxn.accountId))

  if (!account) throw new Error('Account not found')

  let currentBalance = parseFloat(account.balance ?? '0')
  const oldAmount = parseFloat(oldTxn.amount)

  // Reverse old transaction effect
  if (oldTxn.type === 'debit') {
    currentBalance = account.type === 'credit_card' ? currentBalance - oldAmount : currentBalance + oldAmount
  } else {
    currentBalance = account.type === 'credit_card' ? currentBalance + oldAmount : currentBalance - oldAmount
  }

  // Apply new transaction effect
  const newAmount = parseFloat(data.amount ?? oldTxn.amount)
  const newType = data.type ?? oldTxn.type
  if (newType === 'debit') {
    currentBalance = account.type === 'credit_card' ? currentBalance + newAmount : currentBalance - newAmount
  } else {
    currentBalance = account.type === 'credit_card' ? currentBalance - newAmount : currentBalance + newAmount
  }

  const [txn] = await db
    .update(moneyTransactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(moneyTransactions.id, id), eq(moneyTransactions.userId, userId)))
    .returning()

  await db
    .update(moneyAccounts)
    .set({ balance: currentBalance.toFixed(2), updatedAt: new Date() })
    .where(eq(moneyAccounts.id, account.id))

  revalidatePath('/money')
  return txn
}

export async function deleteTransaction(id: number) {
  const userId = await getUserId()

  const [txn] = await db
    .select()
    .from(moneyTransactions)
    .where(and(eq(moneyTransactions.id, id), eq(moneyTransactions.userId, userId)))

  if (!txn) throw new Error('Transaction not found')

  const [account] = await db
    .select()
    .from(moneyAccounts)
    .where(eq(moneyAccounts.id, txn.accountId))

  if (account) {
    let currentBalance = parseFloat(account.balance ?? '0')
    const amount = parseFloat(txn.amount)
    // Reverse effect
    if (txn.type === 'debit') {
      currentBalance = account.type === 'credit_card' ? currentBalance - amount : currentBalance + amount
    } else {
      currentBalance = account.type === 'credit_card' ? currentBalance + amount : currentBalance - amount
    }

    await db
      .update(moneyAccounts)
      .set({ balance: currentBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(moneyAccounts.id, account.id))
  }

  await db
    .delete(moneyTransactions)
    .where(and(eq(moneyTransactions.id, id), eq(moneyTransactions.userId, userId)))

  revalidatePath('/money')
}

// ─── CC Bills ─────────────────────────────────────────────────────────────────

async function upsertCCBill(
  userId: string,
  account: typeof moneyAccounts.$inferSelect,
  txnDate: Date
) {
  const txnMonth = txnDate.getMonth() + 1
  const txnYear = txnDate.getFullYear()

  // Calculate due date for this bill
  let dueDate: Date
  if (account.dueDateDay) {
    // Fixed due day (Axis: 26th of same month)
    dueDate = new Date(txnYear, txnMonth - 1, account.dueDateDay)
    if (dueDate < txnDate) {
      dueDate = new Date(txnYear, txnMonth, account.dueDateDay)
    }
  } else if (account.dueDaysAfterBill && account.billingCycleDay) {
    // Bill generates on billingCycleDay, due N days later (Roar: 1st + 15 = 16th)
    const billDate = new Date(txnYear, txnMonth - 1, account.billingCycleDay)
    dueDate = addDays(billDate, account.dueDaysAfterBill)
  } else {
    dueDate = new Date(txnYear, txnMonth, 15) // fallback
  }

  const existing = await db
    .select()
    .from(ccBills)
    .where(
      and(
        eq(ccBills.userId, userId),
        eq(ccBills.accountId, account.id),
        eq(ccBills.billMonth, txnMonth),
        eq(ccBills.billYear, txnYear)
      )
    )
    .then(r => r[0])

  if (!existing) {
    await db.insert(ccBills).values({
      userId,
      accountId: account.id,
      billMonth: txnMonth,
      billYear: txnYear,
      totalAmount: '0',
      dueDate,
    })
  }
}

export async function getCCBills() {
  const userId = await getUserId()
  return db
    .select({
      id: ccBills.id,
      accountId: ccBills.accountId,
      billMonth: ccBills.billMonth,
      billYear: ccBills.billYear,
      totalAmount: ccBills.totalAmount,
      dueDate: ccBills.dueDate,
      isPaid: ccBills.isPaid,
      paidDate: ccBills.paidDate,
      paidFromAccountId: ccBills.paidFromAccountId,
      paidAmount: ccBills.paidAmount,
      notes: ccBills.notes,
      accountName: moneyAccounts.name,
      accountColor: moneyAccounts.color,
    })
    .from(ccBills)
    .leftJoin(moneyAccounts, eq(ccBills.accountId, moneyAccounts.id))
    .where(eq(ccBills.userId, userId))
    .orderBy(desc(ccBills.billYear), desc(ccBills.billMonth))
}

export async function getSpendingByAccount() {
  const userId = await getUserId()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await db
    .select({
      accountId: moneyTransactions.accountId,
      accountName: moneyAccounts.name,
      accountColor: moneyAccounts.color,
      total: sql<string>`SUM(CAST(${moneyTransactions.amount} AS numeric))`,
    })
    .from(moneyTransactions)
    .leftJoin(moneyAccounts, eq(moneyTransactions.accountId, moneyAccounts.id))
    .where(
      and(
        eq(moneyTransactions.userId, userId),
        eq(moneyTransactions.type, 'debit'),
        gte(moneyTransactions.transactionDate, firstOfMonth)
      )
    )
    .groupBy(moneyTransactions.accountId, moneyAccounts.name, moneyAccounts.color)

  return result
}

export async function markBillPaid(
  billId: number,
  data: { paidFromAccountId: number; paidAmount: string; notes?: string }
) {
  const userId = await getUserId()
  const paidDate = new Date()

  const [bill] = await db
    .update(ccBills)
    .set({
      isPaid: true,
      paidDate,
      paidFromAccountId: data.paidFromAccountId,
      paidAmount: data.paidAmount,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(ccBills.id, billId), eq(ccBills.userId, userId)))
    .returning()

  // Deduct from bank account
  const [bankAccount] = await db
    .select()
    .from(moneyAccounts)
    .where(eq(moneyAccounts.id, data.paidFromAccountId))

  if (bankAccount) {
    const newBalance = parseFloat(bankAccount.balance ?? '0') - parseFloat(data.paidAmount)
    await db
      .update(moneyAccounts)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(moneyAccounts.id, data.paidFromAccountId))
  }

  revalidatePath('/money')
  return bill
}

export async function recalculateCCBillTotals() {
  const userId = await getUserId()
  const bills = await db
    .select()
    .from(ccBills)
    .where(eq(ccBills.userId, userId))

  for (const bill of bills) {
    const firstDay = new Date(bill.billYear, bill.billMonth - 1, 1)
    const lastDay = new Date(bill.billYear, bill.billMonth, 0, 23, 59, 59)

    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${moneyTransactions.amount} AS numeric)), 0)` })
      .from(moneyTransactions)
      .where(
        and(
          eq(moneyTransactions.userId, userId),
          eq(moneyTransactions.accountId, bill.accountId),
          eq(moneyTransactions.type, 'debit'),
          gte(moneyTransactions.transactionDate, firstDay),
          lte(moneyTransactions.transactionDate, lastDay)
        )
      )

    await db
      .update(ccBills)
      .set({ totalAmount: result?.total ?? '0', updatedAt: new Date() })
      .where(eq(ccBills.id, bill.id))
  }

  revalidatePath('/money')
}
