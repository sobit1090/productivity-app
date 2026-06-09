'use client'

import { useState } from 'react'
import { X, Loader2, IndianRupee, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAccount } from '@/app/actions/money'

export function AddAccountDialog({
  onClose,
}: {
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'credit_card' | 'bank_account'>('bank_account')
  const [balance, setBalance] = useState('0')
  const [creditLimit, setCreditLimit] = useState('')
  const [billingCycleDay, setBillingCycleDay] = useState('15')
  const [dueType, setDueType] = useState<'fixed' | 'days_after'>('fixed')
  const [dueDateDay, setDueDateDay] = useState('30')
  const [dueDaysAfterBill, setDueDaysAfterBill] = useState('15')
  const [color, setColor] = useState('#6366f1')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Account Name is required')
      return
    }
    setLoading(true)
    try {
      await createAccount({
        name,
        type,
        balance,
        creditLimit: type === 'credit_card' ? creditLimit : null,
        billingCycleDay: type === 'credit_card' ? parseInt(billingCycleDay) : null,
        dueDateDay: type === 'credit_card' && dueType === 'fixed' ? parseInt(dueDateDay) : null,
        dueDaysAfterBill: type === 'credit_card' && dueType === 'days_after' ? parseInt(dueDaysAfterBill) : null,
        color,
        icon: type === 'credit_card' ? 'credit-card' : 'landmark',
      })
      toast.success(`${name} created!`)
      onClose()
      window.location.reload() // Refresh to show new account
    } catch {
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border bg-card shadow-2xl text-card-foreground"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add New Account
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Account Type */}
          <div>
            <Label>Account Type</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'bank_account'}
                  onChange={() => setType('bank_account')}
                />
                🏦 Bank Account
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'credit_card'}
                  onChange={() => setType('credit_card')}
                />
                💳 Credit Card
              </label>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <Label htmlFor="add-acc-name">Account Name</Label>
            <Input
              id="add-acc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. SBI Savings, HDFC Card"
              className="mt-1"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <Label htmlFor="add-acc-balance">
              {type === 'credit_card' ? 'Current Balance Used (₹)' : 'Initial Balance (₹)'}
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="add-acc-balance"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                type="number"
                step="0.01"
                className="pl-9"
              />
            </div>
          </div>

          {/* Credit limit (CC only) */}
          {type === 'credit_card' && (
            <>
              <div>
                <Label htmlFor="add-acc-limit">Credit Limit (₹)</Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add-acc-limit"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                    type="number"
                    step="0.01"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="add-billing-day">Bill Generate Day (of month)</Label>
                <Input
                  id="add-billing-day"
                  value={billingCycleDay}
                  onChange={e => setBillingCycleDay(e.target.value)}
                  type="number"
                  min="1"
                  max="31"
                  className="mt-1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date Logic</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="radio"
                      checked={dueType === 'fixed'}
                      onChange={() => setDueType('fixed')}
                    />
                    Fixed Date (e.g. 26th)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="radio"
                      checked={dueType === 'days_after'}
                      onChange={() => setDueType('days_after')}
                    />
                    Days after bill (e.g. 15 days)
                  </label>
                </div>

                {dueType === 'fixed' ? (
                  <div>
                    <Label htmlFor="add-due-day" className="text-xs text-muted-foreground">Due Day of Month</Label>
                    <Input
                      id="add-due-day"
                      value={dueDateDay}
                      onChange={e => setDueDateDay(e.target.value)}
                      type="number"
                      min="1"
                      max="31"
                      className="mt-1"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="add-due-after" className="text-xs text-muted-foreground">Due Days After Bill</Label>
                    <Input
                      id="add-due-after"
                      value={dueDaysAfterBill}
                      onChange={e => setDueDaysAfterBill(e.target.value)}
                      type="number"
                      min="1"
                      max="90"
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Color */}
          <div>
            <Label htmlFor="add-acc-color">Card Color</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                id="add-acc-color"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded-lg border border-input"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
