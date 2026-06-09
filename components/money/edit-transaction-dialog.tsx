'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { X, Loader2, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateTransaction } from '@/app/actions/money'

const CATEGORIES = [
  { value: 'food', label: '🍔 Food & Dining' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'bills', label: '📄 Bills & Utilities' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'fuel', label: '⛽ Fuel' },
  { value: 'education', label: '📚 Education' },
  { value: 'other', label: '💸 Other' },
]

const schema = z.object({
  amount: z.string().min(1).refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Invalid amount'),
  type: z.enum(['debit', 'credit']),
  category: z.string().min(1),
  merchant: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type Account = { id: number; name: string; type: string; color: string | null }

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

export function EditTransactionDialog({
  transaction,
  accounts,
  onClose,
  onUpdated,
}: {
  transaction: Transaction
  accounts: Account[]
  onClose: () => void
  onUpdated: (txn: Transaction) => void
}) {
  const [loading, setLoading] = useState(false)

  const txnDate = new Date(transaction.transactionDate)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: transaction.amount,
      type: transaction.type as 'debit' | 'credit',
      category: transaction.category,
      merchant: transaction.merchant ?? '',
      description: transaction.description ?? '',
      notes: transaction.notes ?? '',
      transactionDate: format(txnDate, "yyyy-MM-dd'T'HH:mm"),
    },
  })

  const selectedType = watch('type')

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const result = await updateTransaction(transaction.id, {
        amount: data.amount,
        type: data.type,
        category: data.category,
        merchant: data.merchant || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
        transactionDate: new Date(data.transactionDate),
      })

      onUpdated({
        ...transaction,
        ...result,
        accountName: transaction.accountName,
        accountColor: transaction.accountColor,
        accountType: transaction.accountType,
      })
      toast.success('Transaction updated!')
      onClose()
    } catch {
      toast.error('Failed to update transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-bold">Edit Transaction</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Account info (read-only) */}
          <div className="rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Account: </span>
            <span
              className="font-medium px-2 py-0.5 rounded-full text-xs ml-1"
              style={{ background: `${transaction.accountColor ?? '#888'}20`, color: transaction.accountColor ?? '#888' }}
            >
              {transaction.accountName}
            </span>
          </div>

          {/* Type toggle */}
          <div className="flex rounded-xl border overflow-hidden">
            <button
              type="button"
              onClick={() => setValue('type', 'debit')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                selectedType === 'debit' ? 'bg-red-500 text-white' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              💸 Spent (Debit)
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'credit')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                selectedType === 'credit' ? 'bg-green-500 text-white' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              💰 Received (Credit)
            </button>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="edit-amount">Amount (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-amount"
                {...register('amount')}
                className="pl-9"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Merchant */}
          <div>
            <Label htmlFor="edit-merchant">Where Spent / Merchant</Label>
            <Input id="edit-merchant" {...register('merchant')} className="mt-1" />
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select defaultValue={transaction.category} onValueChange={v => setValue('category', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="edit-date">Date & Time</Label>
            <Input
              id="edit-date"
              {...register('transactionDate')}
              type="datetime-local"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              {...register('notes')}
              className="mt-1 h-16 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
