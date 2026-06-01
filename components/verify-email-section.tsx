'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, CheckCircle2, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'

interface VerifyEmailSectionProps {
    email: string
    emailVerified: boolean
}

export function VerifyEmailSection({ email, emailVerified }: VerifyEmailSectionProps) {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSendVerification = async () => {
        setError(null)
        setLoading(true)
        try {
            const { error: authError } = await authClient.sendVerificationEmail({
                email,
                callbackURL: '/settings',
            })
            if (authError) {
                setError(authError.message ?? 'Failed to send verification email.')
                return
            }
            setSent(true)
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (emailVerified) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Email Verified</h2>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{email}</span> is verified.
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6 border-orange-200 dark:border-orange-900">
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">Verify Your Email</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{email}</span> is not verified yet.
                        Verify your email to secure your account.
                    </p>

                    {sent ? (
                        <div className="flex items-center gap-2 mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 dark:text-green-400 dark:bg-green-950 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Verification email sent to <strong>{email}</strong>. Check your inbox and spam folder.
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div role="alert" className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                                    {error}
                                </div>
                            )}
                            <Button onClick={handleSendVerification} disabled={loading} className="mt-4" variant="outline">
                                {loading
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>
                                    : <><Mail className="h-4 w-4 mr-2" />Send Verification Email</>}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    )
}