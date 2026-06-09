'use client'

import { useState } from 'react'
import { X, Loader2, IndianRupee, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAccount, deleteAccount } from '@/app/actions/money'

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
}

export function EditAccountDialog({
  account,
  onClose,
}: {
  account: Account
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(account.name)
  const [balance, setBalance] = useState(account.balance ?? '0')
  const [creditLimit, setCreditLimit] = useState(account.creditLimit ?? '')
  const [billingCycleDay, setBillingCycleDay] = useState(String(account.billingCycleDay ?? ''))
  const [dueDateDay, setDueDateDay] = useState(String(account.dueDateDay ?? ''))
  const [dueDaysAfterBill, setDueDaysAfterBill] = useState(String(account.dueDaysAfterBill ?? ''))
  const [color, setColor] = useState(account.color ?? '#6366f1')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setLoading(true)
    try {
      await updateAccount(account.id, {
        name,
        balance,
        creditLimit: creditLimit || undefined,
        billingCycleDay: billingCycleDay ? parseInt(billingCycleDay) : undefined,
        dueDateDay: dueDateDay ? parseInt(dueDateDay) : null,
        dueDaysAfterBill: dueDaysAfterBill ? parseInt(dueDaysAfterBill) : null,
        color,
      })
      toast.success(`${name} updated!`)
      onClose()
      window.location.reload() // Refresh to show updated data
    } catch {
      toast.error('Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const typeLabel = account.type === 'credit_card' ? 'credit card' : 'bank account'
    if (confirm(`Are you sure you want to delete this ${typeLabel} "${account.name}"? This will preserve transactions but remove the account from your lists.`)) {
      setLoading(true)
      try {
        await deleteAccount(account.id)
        toast.success(`${account.name} deleted!`)
        onClose()
        window.location.reload()
      } catch {
        toast.error('Failed to delete account')
      } finally {
        setLoading(false)
      }
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
            <Pencil className="h-4 w-4" /> Edit {account.name}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Name */}
          <div>
            <Label htmlFor="acc-name">Account Name</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HDFC Credit Card, SBI Savings"
              className="mt-1"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <Label htmlFor="acc-balance">
              {account.type === 'credit_card' ? 'Current Balance Used (₹)' : 'Current Balance (₹)'}
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="acc-balance"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                type="number"
                step="0.01"
                className="pl-9"
              />
            </div>
          </div>

          {/* Credit limit (CC only) */}
          {account.type === 'credit_card' && (
            <>
              <div>
                <Label htmlFor="acc-limit">Credit Limit (₹)</Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="acc-limit"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                    type="number"
                    step="0.01"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billing-day">Bill Generate Day (of month)</Label>
                <Input
                  id="billing-day"
                  value={billingCycleDay}
                  onChange={e => setBillingCycleDay(e.target.value)}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g. 13"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="due-day" className="text-xs">Fixed Due Day</Label>
                  <Input
                    id="due-day"
                    value={dueDateDay}
                    onChange={e => setDueDateDay(e.target.value)}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 26"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Flipkart Axis style</p>
                </div>
                <div>
                  <Label htmlFor="due-after" className="text-xs">Days After Bill</Label>
                  <Input
                    id="due-after"
                    value={dueDaysAfterBill}
                    onChange={e => setDueDaysAfterBill(e.target.value)}
                    type="number"
                    min="1"
                    max="90"
                    placeholder="e.g. 15"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Roar Bank style</p>
                </div>
              </div>
            </>
          )}

          {/* Color */}
          <div>
            <Label htmlFor="acc-color">Card Color</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                id="acc-color"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded-lg border border-input"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
            
            {/* Delete button (except for 'cash' type account to avoid breaking core dashboard layout) */}
            {account.type !== 'cash' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="w-full gap-2 mt-2"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
