import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, BookOpen, Wallet, ChevronRight } from 'lucide-react'
import { getAnalytics } from '@/app/actions/analytics'
import { getTasks } from '@/app/actions/tasks'
import { getExams } from '@/app/actions/exams'
import { getAccounts } from '@/app/actions/money'
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

  const [analytics, tasks, exams, accounts] = await Promise.all([
    getAnalytics(),
    getTasks(),
    getExams(),
    getAccounts().catch(() => []),
  ])

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length
  const upcomingExamsCount = exams.filter(e => e.status !== 'completed' && e.status !== 'passed').length
  const totalMoneyDue = accounts
    .filter(a => a.type === 'credit_card')
    .reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0)

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

  const currentDateStr = format(new Date(), 'EEEE, dd MMMM yyyy')

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            
            {/* Mobile View: Simplified Stat Cards only */}
            <div className="block md:hidden space-y-6">
              <div className="space-y-1 py-2">
                <h1 className="text-2xl font-bold tracking-tight">Hey, {session.user.name || 'User'}!</h1>
                <p className="text-xs text-muted-foreground">{currentDateStr}</p>
              </div>

              <div className="grid gap-4">
                {/* Money Card */}
                <Link href="/money">
                  <Card className="relative overflow-hidden p-6 border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent hover:bg-amber-500/10 transition-all active:scale-[0.98]">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <span className="inline-flex p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Wallet className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Credit Card Dues</p>
                          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                            ₹{totalMoneyDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                    </div>
                  </Card>
                </Link>

                {/* Tasks Card */}
                <Link href="/tasks">
                  <Card className="relative overflow-hidden p-6 border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-500/5 to-transparent hover:bg-indigo-500/10 transition-all active:scale-[0.98]">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <span className="inline-flex p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <CheckSquare className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tasks to Do</p>
                          <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
                            {pendingTasksCount} Pending
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                    </div>
                  </Card>
                </Link>

                {/* Exams Card */}
                <Link href="/exams">
                  <Card className="relative overflow-hidden p-6 border-l-4 border-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent hover:bg-rose-500/10 transition-all active:scale-[0.98]">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <span className="inline-flex p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <BookOpen className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                          <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                            {upcomingExamsCount} Scheduled
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                    </div>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Desktop View: Full Standard Dashboard details */}
            <div className="hidden md:block space-y-8">
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
                        formDeadline={exam.formDeadline ? new Date(exam.formDeadline) : undefined}
                        admitCardLink={exam.admitCardLink || undefined}
                        admitCardStatus={exam.admitCardStatus || undefined}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground">No upcoming exams</p>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}
