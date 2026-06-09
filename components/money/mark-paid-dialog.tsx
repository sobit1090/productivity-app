'use client'

import { useState } from 'react'
import { X, Loader2, IndianRupee, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { markBillPaid } from '@/app/actions/money'

type Account = { id: number; name: string; type: string; color: string | null }

type Bill = {
  id: number
  accountId: number
  billMonth: number
  billYear: number
  totalAmount: string
  dueDate: Date | string
  isPaid: boolean
  accountName: string | null
  accountColor: string | null
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function formatINR(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(num)
}

export function MarkPaidDialog({
  bill,
  bankAccounts,
  onClose,
}: {
  bill: Bill
  bankAccounts: Account[]
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [fromAccountId, setFromAccountId] = useState<string>('')
  const [paidAmount, setPaidAmount] = useState(bill.totalAmount)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAccountId) { toast.error('Select which account to pay from'); return }

    setLoading(true)
    try {
      await markBillPaid(bill.id, {
        paidFromAccountId: parseInt(fromAccountId),
        paidAmount,
        notes: notes || undefined,
      })
      toast.success(`Bill marked as paid from ${bankAccounts.find(a => a.id === parseInt(fromAccountId))?.name}!`)
      onClose()
    } catch {
      toast.error('Failed to mark bill as paid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Mark Bill as Paid
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bill info */}
          <div className="rounded-xl p-4 text-center" style={{ background: `${bill.accountColor ?? '#888'}15` }}>
            <div className="text-sm text-muted-foreground">{bill.accountName}</div>
            <div className="text-sm font-medium">{MONTHS[bill.billMonth]} {bill.billYear} Bill</div>
            <div className="text-2xl font-bold mt-1" style={{ color: bill.accountColor ?? '#888' }}>
              {formatINR(bill.totalAmount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Due: {format(new Date(bill.dueDate), 'dd MMM yyyy')}
            </div>
          </div>

          {/* Pay from */}
          <div>
            <Label>Pay From</Label>
            <Select onValueChange={setFromAccountId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select bank account..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ background: a.color ?? '#888' }} />
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="paid-amount">Amount Paid (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="paid-amount"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="pl-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="paid-notes">Notes (optional)</Label>
            <Textarea
              id="paid-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="mt-1 h-14 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '✓ Mark Paid'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
