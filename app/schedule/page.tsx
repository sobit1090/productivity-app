import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { SchedulePlanner } from '@/components/schedule-planner'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Schedule Planner - StudyFlow',
  description: 'Plan your daily study schedule with customizable timetable and alternating day templates',
}

export default async function SchedulePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <SchedulePlanner />
          </div>
        </main>
      </div>
    </div>
  )
}
