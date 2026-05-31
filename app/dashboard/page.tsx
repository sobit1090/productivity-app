'use server'

import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getAnalytics } from '@/app/actions/analytics'
import { getTasks } from '@/app/actions/tasks'
import { getExams } from '@/app/actions/exams'
import Link from 'next/link'
import { format } from 'date-fns'
import { TaskCard } from '@/components/task-card'
import { ExamCard } from '@/components/exam-card'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [analytics, tasks, exams] = await Promise.all([
    getAnalytics(),
    getTasks(),
    getExams(),
  ])

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    .slice(0, 5)

  const upcomingExams = exams
    .filter(e => e.status !== 'completed')
    .sort(
      (a, b) =>
        new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    )
    .slice(0, 5)

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold">{analytics.totalTasks}</p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-3xl font-bold">{analytics.completedTasks}</p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                </div>
              </Card>
            </div>

            {/* Upcoming Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upcoming Tasks</h2>
                <Link href="/tasks">
                  <Button>
                    <Plus className="h-4 w-4" />
                    New Task
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      description={task.description || undefined}
                      priority={task.priority || 'medium'}
                      status={task.status || 'pending'}
                      dueDate={task.dueDate ? new Date(task.dueDate) : undefined}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No upcoming tasks</p>
                )}
              </div>
            </div>

            {/* Upcoming Exams */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upcoming Exams</h2>
                <Link href="/exams">
                  <Button>
                    <Plus className="h-4 w-4" />
                    New Exam
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingExams.length > 0 ? (
                  upcomingExams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={exam.title}
                      description={exam.description || undefined}
                      examDate={new Date(exam.examDate)}
                      duration={exam.duration || undefined}
                      location={exam.location || undefined}
                      status={exam.status || 'scheduled'}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No upcoming exams</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
