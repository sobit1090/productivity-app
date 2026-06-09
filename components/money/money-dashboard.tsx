'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns'
import {
  CreditCard, Landmark, Banknote, TrendingUp, TrendingDown,
  Plus, Filter, Search, AlertCircle, CheckCircle2, Clock,
  Wallet, ArrowUpRight, ArrowDownLeft, MoreHorizontal,
  ChevronDown, Pencil, Trash2, X, Sparkles, Check, ChevronRight, ChevronLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { AddTransactionDialog } from './add-transaction-dialog'
import { EditTransactionDialog } from './edit-transaction-dialog'
import { MarkPaidDialog } from './mark-paid-dialog'
import { EditAccountDialog } from './edit-account-dialog'
import { deleteTransaction, markBillPaid, saveCustomAccounts } from '@/app/actions/money'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Account = {
  id: number
  name: string
  type: string
  balance: string | null
  creditLimit: string | null
  billingCycleDay: number | null
  dueDateDay: number | null
  dueDaysAfterBill: number | null
  color: string | null
  icon: string | null
}

type Transaction = {
  id: number
  accountId: number
  amount: string
  type: string
  category: string
  merchant: string | null
  description: string | null
  notes: string | null
  transactionDate: Date | string
  accountName: string | null
  accountColor: string | null
  accountType: string | null
}

type Bill = {
  id: number
  accountId: number
  billMonth: number
  billYear: number
  totalAmount: string
  dueDate: Date | string
  isPaid: boolean
  paidDate: Date | string | null
  paidFromAccountId: number | null
  paidAmount: string | null
  notes: string | null
  accountName: string | null
  accountColor: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔', shopping: '🛍️', travel: '✈️', bills: '📄',
  entertainment: '🎬', healthcare: '🏥', fuel: '⛽',
  education: '📚', other: '💸',
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316', shopping: '#8b5cf6', travel: '#06b6d4', bills: '#ef4444',
  entertainment: '#f59e0b', healthcare: '#10b981', fuel: '#6366f1',
  education: '#ec4899', other: '#64748b',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDueDateForAccount(account: Account): Date | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (account.type !== 'credit_card') return null

  if (account.dueDateDay) {
    let due = new Date(y, m, account.dueDateDay)
    if (isBefore(due, now)) due = new Date(y, m + 1, account.dueDateDay)
    return due
  }
  if (account.billingCycleDay && account.dueDaysAfterBill) {
    let billDate = new Date(y, m, account.billingCycleDay)
    if (isBefore(billDate, now)) billDate = new Date(y, m + 1, account.billingCycleDay)
    return addDays(billDate, account.dueDaysAfterBill)
  }
  return null
}

function getDaysUntilDue(account: Account): number | null {
  const due = getDueDateForAccount(account)
  if (!due) return null
  return differenceInDays(due, new Date())
}

function formatINR(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num)
}

// ─── Credit Card Tile ─────────────────────────────────────────────────────────

function CreditCardTile({
  account,
  transactions,
  bills,
  onAddTransaction,
  bankAccounts,
}: {
  account: Account
  transactions: Transaction[]
  bills: Bill[]
  onAddTransaction: (acc: Account) => void
  bankAccounts: Account[]
}) {
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const used = parseFloat(account.balance ?? '0')
  const limit = parseFloat(account.creditLimit ?? '1')
  const available = limit - used
  const utilization = Math.min((used / limit) * 100, 100)

  const daysUntilDue = getDaysUntilDue(account)
  const dueDate = getDueDateForAccount(account)
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 5
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0

  // Current month bill
  const now = new Date()
  const currentBill = bills.find(
    b => b.accountId === account.id && b.billMonth === now.getMonth() + 1 && b.billYear === now.getFullYear()
  )

  // This month's spend on this card
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlySpend = transactions
    .filter(t => t.accountId === account.id && t.type === 'debit' && new Date(t.transactionDate) >= monthStart)
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${account.color}dd 0%, ${account.color}88 60%, #1a1a2e 100%)`,
        minHeight: '200px',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20" style={{ background: account.color ?? '#fff' }} />
      <div className="absolute -bottom-12 -right-4 h-40 w-40 rounded-full opacity-10" style={{ background: account.color ?? '#fff' }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 opacity-80" />
              <span className="text-xs font-medium opacity-75 uppercase tracking-wider">Credit Card</span>
            </div>
            <h3 className="text-lg font-bold">{account.name}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onAddTransaction(account)}
              className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <div className="text-3xl font-bold tracking-tight">{formatINR(used)}</div>
          <div className="text-sm opacity-70">of {formatINR(limit)} limit used</div>
        </div>

        {/* Utilization bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5 opacity-80">
            <span>Available: {formatINR(Math.max(0, available))}</span>
            <span>{utilization.toFixed(0)}% used</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${utilization}%`,
                background: utilization > 80 ? '#ef4444' : utilization > 60 ? '#f59e0b' : '#22c55e'
              }}
            />
          </div>
        </div>

        {/* Due date & bill info */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              {isOverdue ? (
                <AlertCircle className="h-4 w-4 text-red-300" />
              ) : isUrgent ? (
                <Clock className="h-4 w-4 text-yellow-300" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-300" />
              )}
              <span className={cn('text-sm font-semibold', isOverdue ? 'text-red-300' : isUrgent ? 'text-yellow-300' : 'text-green-300')}>
                {isOverdue
                  ? `Overdue by ${Math.abs(daysUntilDue!)} days!`
                  : daysUntilDue === 0
                  ? 'Due TODAY'
                  : daysUntilDue !== null
                  ? `Due in ${daysUntilDue} days`
                  : 'No due date'}
              </span>
            </div>
            {dueDate && (
              <div className="text-xs opacity-60 mt-0.5">
                {account.billingCycleDay && `Bill: ${account.billingCycleDay}th • `}
                Due: {format(dueDate, 'dd MMM yyyy')}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{formatINR(monthlySpend)}</div>
            <div className="text-xs opacity-60">this month</div>
          </div>
        </div>

        {/* Mark Paid */}
        {currentBill && !currentBill.isPaid && (
          <button
            onClick={() => setShowMarkPaid(true)}
            className="mt-3 w-full rounded-xl bg-white/15 py-2 text-sm font-medium hover:bg-white/25 transition-colors text-center"
          >
            Mark Bill Paid
          </button>
        )}
        {currentBill?.isPaid && (
          <div className="mt-3 w-full rounded-xl bg-green-500/20 py-2 text-sm font-medium text-center text-green-300">
            ✓ Bill Paid
          </div>
        )}
      </div>

      {showMarkPaid && currentBill && (
        <MarkPaidDialog
          bill={currentBill}
          bankAccounts={bankAccounts}
          onClose={() => setShowMarkPaid(false)}
        />
      )}
      {showEdit && (
        <EditAccountDialog account={account} onClose={() => setShowEdit(false)} />
      )}
    </div>
  )
}

// ─── Bank Account Tile ────────────────────────────────────────────────────────

function BankAccountTile({
  account,
  onAddTransaction,
}: {
  account: Account
  onAddTransaction: (acc: Account) => void
}) {
  const [showEdit, setShowEdit] = useState(false)
  const balance = parseFloat(account.balance ?? '0')
  const isNegative = balance < 0

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 shadow-lg border"
      style={{
        background: `linear-gradient(135deg, ${account.color}15 0%, ${account.color}05 100%)`,
        borderColor: `${account.color}30`,
      }}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-5" style={{ background: account.color ?? '#888' }} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg p-2" style={{ background: `${account.color}20` }}>
              <Landmark className="h-4 w-4" style={{ color: account.color ?? '#888' }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bank Account</span>
          </div>
          <h3 className="text-base font-bold mb-1">{account.name}</h3>
          <div className={cn('text-2xl font-bold', isNegative ? 'text-red-500' : 'text-foreground')}>
            {formatINR(balance)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Available Balance</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowEdit(true)} className="rounded-lg bg-muted p-1.5 hover:bg-muted/80 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onAddTransaction(account)} className="rounded-lg p-1.5 hover:bg-muted transition-colors" style={{ background: `${account.color}20` }}>
            <Plus className="h-3.5 w-3.5" style={{ color: account.color ?? '#888' }} />
          </button>
        </div>
      </div>

      {showEdit && <EditAccountDialog account={account} onClose={() => setShowEdit(false)} />}
    </div>
  )
}

// ─── Cash Tile ────────────────────────────────────────────────────────────────

function CashTile({ account, onAddTransaction }: { account: Account; onAddTransaction: (acc: Account) => void }) {
  const [showEdit, setShowEdit] = useState(false)
  const balance = parseFloat(account.balance ?? '0')

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg border bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cash</span>
          </div>
          <h3 className="text-base font-bold mb-1">Cash in Hand</h3>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(balance)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Physical Cash</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowEdit(true)} className="rounded-lg bg-muted p-1.5 hover:bg-muted/80 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onAddTransaction(account)} className="rounded-lg bg-emerald-500/20 p-1.5 hover:bg-emerald-500/30 transition-colors">
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
          </button>
        </div>
      </div>
      {showEdit && <EditAccountDialog account={account} onClose={() => setShowEdit(false)} />}
    </div>
  )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({
  txn,
  accounts,
  onEdit,
  onDelete,
}: {
  txn: Transaction
  accounts: Account[]
  onEdit: (txn: Transaction) => void
  onDelete: (id: number) => void
}) {
  const icon = CATEGORY_ICONS[txn.category] ?? '💸'
  const color = CATEGORY_COLORS[txn.category] ?? '#64748b'
  const isDebit = txn.type === 'debit'
  const date = new Date(txn.transactionDate)

  return (
    <div className="group flex items-center gap-4 rounded-xl p-3 hover:bg-muted/50 transition-colors">
      {/* Category icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
        style={{ background: `${color}20` }}
      >
        {icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{txn.merchant || txn.description || 'Transaction'}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0" style={{ borderColor: `${color}50`, color }}>
            {txn.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${txn.accountColor ?? '#888'}20`, color: txn.accountColor ?? '#888' }}
          >
            {txn.accountName}
          </span>
          <span className="text-xs text-muted-foreground">{format(date, 'dd MMM, hh:mm a')}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <div className={cn('text-sm font-bold', isDebit ? 'text-red-500' : 'text-green-500')}>
          {isDebit ? '−' : '+'}{formatINR(txn.amount)}
        </div>
        <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
          {isDebit ? <ArrowUpRight className="h-3 w-3 text-red-400" /> : <ArrowDownLeft className="h-3 w-3 text-green-400" />}
          {isDebit ? 'Spent' : 'Received'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(txn)}
          className="rounded-lg p-1.5 hover:bg-blue-500/10 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5 text-blue-500" />
        </button>
        <button
          onClick={() => onDelete(txn.id)}
          className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>
    </div>
  )
}

// ─── Onboarding Wizard ────────────────────────────────────────────────────────

function MoneyOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  type OnboardingCard = {
    name: string
    creditLimit: string
    billingCycleDay: number
    dueDateDay: number | null
    dueDaysAfterBill: number | null
    color: string
  }

  // Initial templates matching the user's setup
  const [cards, setCards] = useState<OnboardingCard[]>([
    { name: 'Flipkart Axis Bank', creditLimit: '19000', billingCycleDay: 13, dueDateDay: 26, dueDaysAfterBill: null, color: '#f97316' },
    { name: 'Roar Bank', creditLimit: '5000', billingCycleDay: 1, dueDateDay: null, dueDaysAfterBill: 15, color: '#8b5cf6' }
  ])

  const [banks, setBanks] = useState([
    { name: 'Kotak Bank', balance: '0', color: '#ef4444' },
    { name: 'Indie Bank', balance: '0', color: '#06b6d4' }
  ])

  const [cashBalance, setCashBalance] = useState('0')

  // Inline forms for adding new items
  const [newCard, setNewCard] = useState({
    name: '',
    creditLimit: '',
    billingCycleDay: 15,
    dueType: 'fixed', // 'fixed' | 'days_after'
    dueDateDay: 30,
    dueDaysAfterBill: 15,
    color: '#6366f1'
  })

  const [newBank, setNewBank] = useState({
    name: '',
    balance: '',
    color: '#10b981'
  })

  const [showAddCardForm, setShowAddCardForm] = useState(false)
  const [showAddBankForm, setShowAddBankForm] = useState(false)

  const handleAddCard = () => {
    if (!newCard.name || !newCard.creditLimit) {
      toast.error('Card Name and Limit are required')
      return
    }
    setCards([
      ...cards,
      {
        name: newCard.name,
        creditLimit: newCard.creditLimit,
        billingCycleDay: Number(newCard.billingCycleDay),
        dueDateDay: newCard.dueType === 'fixed' ? Number(newCard.dueDateDay) : null,
        dueDaysAfterBill: newCard.dueType === 'days_after' ? Number(newCard.dueDaysAfterBill) : null,
        color: newCard.color
      }
    ])
    setNewCard({
      name: '',
      creditLimit: '',
      billingCycleDay: 15,
      dueType: 'fixed',
      dueDateDay: 30,
      dueDaysAfterBill: 15,
      color: '#6366f1'
    })
    setShowAddCardForm(false)
  }

  const handleAddBank = () => {
    if (!newBank.name) {
      toast.error('Bank Name is required')
      return
    }
    setBanks([
      ...banks,
      {
        name: newBank.name,
        balance: newBank.balance || '0',
        color: newBank.color
      }
    ])
    setNewBank({
      name: '',
      balance: '',
      color: '#10b981'
    })
    setShowAddBankForm(false)
  }

  const handleSave = async (quickSetup = false) => {
    setIsSubmitting(true)
    try {
      let finalAccounts = []

      if (quickSetup) {
        // Just use default user setup directly
        finalAccounts = [
          { name: 'Flipkart Axis Bank', type: 'credit_card' as const, balance: '0', creditLimit: '19000', billingCycleDay: 13, dueDateDay: 26, dueDaysAfterBill: null, color: '#f97316' },
          { name: 'Roar Bank', type: 'credit_card' as const, balance: '0', creditLimit: '5000', billingCycleDay: 1, dueDateDay: null, dueDaysAfterBill: 15, color: '#8b5cf6' },
          { name: 'Kotak Bank', type: 'bank_account' as const, balance: '0', color: '#ef4444' },
          { name: 'Indie Bank', type: 'bank_account' as const, balance: '0', color: '#06b6d4' },
          { name: 'Cash', type: 'cash' as const, balance: '0', color: '#22c55e' }
        ]
      } else {
        // Construct from wizard state
        cards.forEach(c => {
          finalAccounts.push({
            name: c.name,
            type: 'credit_card' as const,
            balance: '0',
            creditLimit: c.creditLimit,
            billingCycleDay: c.billingCycleDay,
            dueDateDay: c.dueDateDay,
            dueDaysAfterBill: c.dueDaysAfterBill,
            color: c.color
          })
        })

        banks.forEach(b => {
          finalAccounts.push({
            name: b.name,
            type: 'bank_account' as const,
            balance: b.balance,
            color: b.color
          })
        })

        finalAccounts.push({
          name: 'Cash',
          type: 'cash' as const,
          balance: cashBalance,
          color: '#22c55e'
        })
      }

      await saveCustomAccounts(finalAccounts)
      toast.success('Money Management Setup Complete!')
      router.refresh()
    } catch (e: any) {
      toast.error('Failed to save accounts: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-card border rounded-2xl shadow-xl space-y-6">
      
      {/* Progress header */}
      {step > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && 'Credit Cards'}
              {step === 2 && 'Bank Accounts'}
              {step === 3 && 'Cash Setup'}
              {step === 4 && 'Review & Finish'}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Step 0: Welcome Screen */}
      {step === 0 && (
        <div className="text-center space-y-6 py-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-2">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Setup Money Manager</h2>
            <p className="text-sm text-muted-foreground">
              Let's customize your credit cards, banks, and cash accounts to start tracking every rupee!
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            <Button onClick={() => setStep(1)} className="w-full gap-2">
              Start Custom Setup Wizard <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleSave(true)} variant="outline" className="w-full gap-2 text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
              Quick Setup Default Accounts
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Credit Cards Setup */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Configure Credit Cards</h3>
          <p className="text-xs text-muted-foreground">
            Configure cards you use regularly. You can also add custom ones like SBI or HDFC.
          </p>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {cards.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Limit: ₹{parseFloat(c.creditLimit).toLocaleString()} • Bill Day: {c.billingCycleDay}th
                  </div>
                </div>
                <button
                  onClick={() => setCards(cards.filter((_, i) => i !== idx))}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {!showAddCardForm ? (
            <Button onClick={() => setShowAddCardForm(true)} variant="outline" size="sm" className="w-full gap-1 border-dashed">
              <Plus className="h-4 w-4" /> Add Custom Card
            </Button>
          ) : (
            <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
              <div>
                <label className="text-xs font-semibold">Card Name (e.g. HDFC Regalia, SBI SimpleClick)</label>
                <Input
                  placeholder="Card Name"
                  value={newCard.name}
                  onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Limit (₹)</label>
                  <Input
                    type="number"
                    placeholder="20000"
                    value={newCard.creditLimit}
                    onChange={e => setNewCard({ ...newCard, creditLimit: e.target.value })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Bill Day of Month</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={newCard.billingCycleDay}
                    onChange={e => setNewCard({ ...newCard, billingCycleDay: Number(e.target.value) })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Due Date Logic</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="radio"
                      checked={newCard.dueType === 'fixed'}
                      onChange={() => setNewCard({ ...newCard, dueType: 'fixed' })}
                    />
                    Fixed Date (e.g. 26th)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="radio"
                      checked={newCard.dueType === 'days_after'}
                      onChange={() => setNewCard({ ...newCard, dueType: 'days_after' })}
                    />
                    Days after bill (e.g. 15 days)
                  </label>
                </div>

                {newCard.dueType === 'fixed' ? (
                  <div>
                    <label className="text-xs text-muted-foreground">Due Day of Month</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={newCard.dueDateDay}
                      onChange={e => setNewCard({ ...newCard, dueDateDay: Number(e.target.value) })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground">Due Days After Bill</label>
                    <Input
                      type="number"
                      value={newCard.dueDaysAfterBill}
                      onChange={e => setNewCard({ ...newCard, dueDaysAfterBill: Number(e.target.value) })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowAddCardForm(false)} variant="ghost" size="sm">Cancel</Button>
                <Button onClick={handleAddCard} size="sm">Add Card</Button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button onClick={() => setStep(0)} variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} size="sm" className="gap-1">
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Bank Accounts Setup */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Configure Bank Accounts</h3>
          <p className="text-xs text-muted-foreground">
            Configure bank accounts where you keep funds to pay CC bills (e.g. SBI, HDFC, Kotak).
          </p>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {banks.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <div className="font-semibold text-sm">{b.name}</div>
                  <div className="text-xs text-muted-foreground">Initial Balance: ₹{parseFloat(b.balance).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => setBanks(banks.filter((_, i) => i !== idx))}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {!showAddBankForm ? (
            <Button onClick={() => setShowAddBankForm(true)} variant="outline" size="sm" className="w-full gap-1 border-dashed">
              <Plus className="h-4 w-4" /> Add Custom Bank Account
            </Button>
          ) : (
            <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
              <div>
                <label className="text-xs font-semibold">Bank Name (e.g. SBI Savings, HDFC Bank)</label>
                <Input
                  placeholder="Bank Name"
                  value={newBank.name}
                  onChange={e => setNewBank({ ...newBank, name: e.target.value })}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Initial Balance (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newBank.balance}
                  onChange={e => setNewBank({ ...newBank, balance: e.target.value })}
                  className="mt-1 h-8 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddBank()
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowAddBankForm(false)} variant="ghost" size="sm">Cancel</Button>
                <Button onClick={handleAddBank} size="sm">Add Bank</Button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button onClick={() => setStep(1)} variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} size="sm" className="gap-1">
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Cash Setup */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Configure Cash</h3>
          <p className="text-xs text-muted-foreground">
            Configure how much physical cash you currently have in hand to keep track of offline spending.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Physical Cash Balance (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={cashBalance}
                onChange={e => setCashBalance(e.target.value)}
                className="mt-1"
                onKeyDown={e => {
                  if (e.key === 'Enter') setStep(4)
                }}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={() => setStep(2)} variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(4)} size="sm" className="gap-1">
              Review Setup <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review and Finish */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Confirm Account Setup</h3>
          <p className="text-xs text-muted-foreground">
            Please review the accounts before generating the dashboard.
          </p>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {cards.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Credit Cards</div>
                {cards.map((c, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b">
                    <span>💳 {c.name}</span>
                    <span className="font-semibold">₹{parseFloat(c.creditLimit).toLocaleString()} limit</span>
                  </div>
                ))}
              </div>
            )}

            {banks.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground mt-2">Bank Accounts</div>
                {banks.map((b, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b">
                    <span>🏦 {b.name}</span>
                    <span className="font-semibold">₹{parseFloat(b.balance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground mt-2">Cash</div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span>💵 Cash in Hand</span>
                <span className="font-semibold">₹{parseFloat(cashBalance || '0').toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={() => setStep(3)} variant="ghost" size="sm" className="gap-1" disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => handleSave(false)} size="sm" className="gap-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Finish Setup & Open Dashboard'} <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function MoneyDashboard({
  accounts: initialAccounts,
  transactions: initialTransactions,
  bills: initialBills,
}: {
  accounts: Account[]
  transactions: Transaction[]
  bills: Bill[]
}) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (initialAccounts.length === 0) {
    return <MoneyOnboarding />
  }

  const accounts = initialAccounts
  const bills = initialBills

  const creditCards = accounts.filter(a => a.type === 'credit_card')
  const bankAccounts = accounts.filter(a => a.type === 'bank_account')
  const cashAccount = accounts.find(a => a.type === 'cash')

  // Filtered transactions
  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      if (filterAccount !== 'all' && t.accountId !== parseInt(filterAccount)) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.merchant?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q) && !t.category.includes(q)) return false
      }
      return true
    })
  }, [transactions, filterAccount, filterCategory, searchQuery])

  // Category spending data for chart
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        map[t.category] = (map[t.category] ?? 0) + parseFloat(t.amount)
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, icon: CATEGORY_ICONS[name], color: CATEGORY_COLORS[name] }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Monthly spend per account for bar chart
  const monthlySpendData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const month = MONTHS[new Date(t.transactionDate).getMonth()]
        if (!map[month]) map[month] = {}
        const key = t.accountName ?? 'Unknown'
        map[month][key] = (map[month][key] ?? 0) + parseFloat(t.amount)
      })
    return Object.entries(map).map(([month, accounts]) => ({ month, ...accounts }))
  }, [transactions])

  const totalDebt = creditCards.reduce((s, c) => s + parseFloat(c.balance ?? '0'), 0)
  const totalSavings = bankAccounts.reduce((s, b) => s + parseFloat(b.balance ?? '0'), 0)
    + parseFloat(cashAccount?.balance ?? '0')

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transaction deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Money Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track every rupee across all your accounts</p>
        </div>
        <Button onClick={() => { setSelectedAccount(null); setShowAdd(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Total CC Debt</div>
          <div className="text-xl font-bold text-red-500">{formatINR(totalDebt)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Savings</div>
          <div className="text-xl font-bold text-green-500">{formatINR(totalSavings)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Net Balance</div>
          <div className={cn('text-xl font-bold', totalSavings - totalDebt >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatINR(totalSavings - totalDebt)}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Transactions</div>
          <div className="text-xl font-bold">{transactions.length}</div>
        </div>
      </div>

      {/* Credit Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Credit Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map(card => (
            <CreditCardTile
              key={card.id}
              account={card}
              transactions={transactions}
              bills={bills}
              onAddTransaction={acc => { setSelectedAccount(acc); setShowAdd(true) }}
              bankAccounts={bankAccounts}
            />
          ))}
        </div>
      </div>

      {/* Bank Accounts + Cash */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Bank Accounts & Cash
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map(acc => (
            <BankAccountTile
              key={acc.id}
              account={acc}
              onAddTransaction={acc => { setSelectedAccount(acc); setShowAdd(true) }}
            />
          ))}
          {cashAccount && (
            <CashTile
              account={cashAccount}
              onAddTransaction={acc => { setSelectedAccount(acc); setShowAdd(true) }}
            />
          )}
        </div>
      </div>

      {/* Analytics */}
      {categorySpend.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Spending Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut chart */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">By Category</h3>
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={categorySpend}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categorySpend.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatINR(value), '']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 min-w-[100px]">
                  {categorySpend.slice(0, 6).map(c => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-xs text-muted-foreground capitalize">{c.name}</span>
                      <span className="text-xs font-medium ml-auto">{formatINR(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top categories */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">Top Spending</h3>
              <div className="space-y-2.5">
                {categorySpend.slice(0, 5).map(c => {
                  const total = categorySpend.reduce((s, x) => s + x.value, 0)
                  const pct = (c.value / total) * 100
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>{c.icon}</span>
                          <span className="capitalize">{c.name}</span>
                        </span>
                        <span className="font-medium">{formatINR(c.value)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Transactions
            <Badge variant="secondary">{filteredTxns.length}</Badge>
          </h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            {/* Account filter */}
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Category filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(CATEGORY_ICONS).map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border bg-card divide-y divide-border">
          {filteredTxns.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet. Add your first one!</p>
            </div>
          ) : (
            filteredTxns.map(txn => (
              <TransactionRow
                key={txn.id}
                txn={txn}
                accounts={accounts}
                onEdit={setEditingTxn}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Dialog */}
      {showAdd && (
        <AddTransactionDialog
          accounts={accounts}
          defaultAccount={selectedAccount}
          onClose={() => { setShowAdd(false); setSelectedAccount(null) }}
          onAdded={txn => setTransactions(prev => [txn as Transaction, ...prev])}
        />
      )}

      {/* Edit Transaction Dialog */}
      {editingTxn && (
        <EditTransactionDialog
          transaction={editingTxn}
          accounts={accounts}
          onClose={() => setEditingTxn(null)}
          onUpdated={updated => setTransactions(prev =>
            prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
          )}
        />
      )}
    </div>
  )
}
