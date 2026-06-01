import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ChangePasswordForm } from '@/components/change-password-form'
import { VerifyEmailSection } from '@/components/verify-email-section'

export const metadata = { title: 'Settings - StudyFlow' }

export default async function SettingsPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect('/sign-in')

    const user = session.user as {
        id: string
        name: string
        email: string
        emailVerified?: boolean
        image?: string | null
    }

    return (
        <div className="flex h-screen flex-col md:flex-row">
            <DashboardSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <DashboardHeader />
                <main className="overflow-y-auto bg-background p-4 md:p-8">
                    <div className="mx-auto max-w-2xl space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                            <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
                        </div>
                        <VerifyEmailSection
                            email={user.email}
                            emailVerified={user.emailVerified ?? false}
                        />
                        <ChangePasswordForm />
                    </div>
                </main>
            </div>
        </div>
    )
}