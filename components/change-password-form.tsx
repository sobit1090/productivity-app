'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'

export function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.')
            return
        }
        if (currentPassword === newPassword) {
            setError('New password must be different from your current password.')
            return
        }

        setLoading(true)
        try {
            const { error: authError } = await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            })

            if (authError) {
                const msg = authError.message ?? ''
                if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
                    setError('Current password is incorrect.')
                } else {
                    setError(msg || 'Failed to change password. Please try again.')
                }
                return
            }

            setSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                        <Input
                            id="currentPassword"
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                            disabled={loading}
                            className="pr-10"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                            disabled={loading}
                            className="pr-10"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            required
                            disabled={loading}
                            className="pr-10"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                        {error}
                    </div>
                )}

                {success && (
                    <div role="status" className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 dark:text-green-400 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Password changed successfully! All other sessions have been signed out.
                    </div>
                )}

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</>
                        : 'Update Password'}
                </Button>
            </form>
        </Card>
    )
}