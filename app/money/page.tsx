import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAccounts, getTransactions, getCCBills, seedDefaultAccounts } from '@/app/actions/money'
import { MoneyDashboard } from '@/components/money/money-dashboard'

export const metadata = {
  title: 'Money Management | StudyFlow',
  description: 'Track your credit cards, bank accounts, and every rupee spent',
}

export default async function MoneyPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  // Seed default accounts on first visit
  await seedDefaultAccounts()

  const [accounts, transactions, bills] = await Promise.all([
    getAccounts(),
    getTransactions({ limit: 100 }),
    getCCBills(),
  ])

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background">
          <MoneyDashboard
            accounts={accounts}
            transactions={transactions}
            bills={bills}
          />
        </main>
      </div>
    </div>
  )
}
