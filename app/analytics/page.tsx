import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { getAnalytics, getStudySessionStats } from '@/app/actions/analytics'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AnalyticsPageClient } from '@/components/analytics-page-client'

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [analytics, studyStats] = await Promise.all([
    getAnalytics(),
    getStudySessionStats(),
  ])

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold">{analytics.totalTasks}</p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Completed Tasks
                  </p>
                  <p className="text-3xl font-bold">{analytics.completedTasks}</p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Study Hours</p>
                  <p className="text-3xl font-bold">
                    {studyStats.totalHours} hrs
                  </p>
                </div>
              </Card>
            </div>

            {/* Charts - rendered on client */}
            <AnalyticsPageClient
              analytics={analytics}
              studyStats={studyStats}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
