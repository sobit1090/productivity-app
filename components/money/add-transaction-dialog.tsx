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
import { createTransaction } from '@/app/actions/money'

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
  accountId: z.string().min(1, 'Select an account'),
  amount: z.string().min(1, 'Enter amount').refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Invalid amount'),
  type: z.enum(['debit', 'credit']),
  category: z.string().min(1, 'Select a category'),
  merchant: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, 'Select a date'),
})

type FormValues = z.infer<typeof schema>

type Account = {
  id: number
  name: string
  type: string
  color: string | null
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

export function AddTransactionDialog({
  accounts,
  defaultAccount,
  onClose,
  onAdded,
}: {
  accounts: Account[]
  defaultAccount: Account | null
  onClose: () => void
  onAdded: (txn: Transaction) => void
}) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: defaultAccount ? String(defaultAccount.id) : '',
      type: 'debit',
      category: 'other',
      transactionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  })

  const selectedType = watch('type')

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const txnDate = new Date(data.transactionDate)
      const result = await createTransaction({
        accountId: parseInt(data.accountId),
        amount: data.amount,
        type: data.type,
        category: data.category,
        merchant: data.merchant || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
        transactionDate: txnDate,
      })

      const account = accounts.find(a => a.id === parseInt(data.accountId))
      onAdded({
        ...result,
        accountName: account?.name ?? null,
        accountColor: account?.color ?? null,
        accountType: account?.type ?? null,
      })
      toast.success('Transaction added!')
      onClose()
    } catch (err) {
      toast.error('Failed to add transaction')
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-bold">Add Transaction</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl border overflow-hidden">
            <button
              type="button"
              onClick={() => setValue('type', 'debit')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                selectedType === 'debit'
                  ? 'bg-red-500 text-white'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              💸 Spent (Debit)
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'credit')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                selectedType === 'credit'
                  ? 'bg-green-500 text-white'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              💰 Received (Credit)
            </button>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                {...register('amount')}
                placeholder="0.00"
                className="pl-9"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Where Spent */}
          <div>
            <Label htmlFor="merchant">Where Spent / Merchant</Label>
            <Input
              id="merchant"
              {...register('merchant')}
              placeholder="e.g. Swiggy, Amazon, Petrol Bunk..."
              className="mt-1"
            />
          </div>

          {/* Account */}
          <div>
            <Label>From Which Account / Card</Label>
            <Select
              defaultValue={defaultAccount ? String(defaultAccount.id) : undefined}
              onValueChange={v => setValue('accountId', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ background: a.color ?? '#888' }}
                      />
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId.message}</p>}
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select defaultValue="other" onValueChange={v => setValue('category', v)}>
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
            <Label htmlFor="transactionDate">Date & Time</Label>
            <Input
              id="transactionDate"
              {...register('transactionDate')}
              type="datetime-local"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes..."
              className="mt-1 h-16 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
