import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { getTasks } from '@/app/actions/tasks'
import { getExams } from '@/app/actions/exams'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'

export default async function CalendarPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [tasks, exams] = await Promise.all([getTasks(), getExams()])

  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const startWeekday = monthStart.getDay()
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group events by date
  const eventsByDate = new Map<string, { type: string; title: string }[]>()

  tasks.forEach(task => {
    if (task.dueDate) {
      const date = format(new Date(task.dueDate), 'yyyy-MM-dd')
      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, [])
      }
      eventsByDate.get(date)?.push({ type: 'task', title: task.title })
    }
  })

  exams.forEach(exam => {
    if (exam.examDate) {
      const date = format(new Date(exam.examDate), 'yyyy-MM-dd')
      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, [])
      }
      eventsByDate.get(date)?.push({ type: 'exam', title: `📝 Exam: ${exam.title}` })
    }

    if (exam.resultDate) {
      const date = format(new Date(exam.resultDate), 'yyyy-MM-dd')
      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, [])
      }
      const scoreStr = exam.score ? ` (${exam.score})` : ''
      eventsByDate.get(date)?.push({ type: 'result', title: `🏆 Result: ${exam.title}${scoreStr}` })
    }
  })

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-3xl font-bold">Calendar</h1>

            <Card className="p-6">
              <h2 className="mb-6 text-2xl font-bold">
                {format(today, 'MMMM yyyy')}
              </h2>

              {/* Calendar Grid */}
              <div className="space-y-4">
                {/* Weekdays header */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    day => (
                      <div
                        key={day}
                        className="py-2 text-center font-semibold text-muted-foreground"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for weekday offset */}
                  {Array.from({ length: startWeekday }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-24 rounded-lg border border-transparent bg-muted/10 opacity-40"
                    />
                  ))}
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const dayEvents = eventsByDate.get(dateStr) || []
                    const isToday = format(today, 'yyyy-MM-dd') === dateStr

                    const isSaturday = day.getDay() === 6
                    const isSunday = day.getDay() === 0

                    let borderClass = 'border-border'
                    let bgClass = 'bg-card'
                    let textClass = 'text-foreground'

                    if (isToday) {
                      borderClass = 'border-primary'
                      bgClass = 'bg-primary/10'
                      textClass = 'text-primary font-bold'
                    } else if (isSaturday) {
                      borderClass = 'border-red-200/50 dark:border-red-900/20'
                      bgClass = 'bg-red-50/25 dark:bg-red-950/10'
                      textClass = 'text-red-500/90 dark:text-red-400'
                    } else if (isSunday) {
                      borderClass = 'border-red-200 dark:border-red-900/40'
                      bgClass = 'bg-red-100/20 dark:bg-red-950/25'
                      textClass = 'text-red-600 dark:text-red-400 font-semibold'
                    }

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-24 rounded-lg border p-2 flex flex-col justify-between transition-colors ${borderClass} ${bgClass} ${textClass}`}
                      >
                        <div className="mb-2 text-xs font-semibold">{format(day, 'd')}</div>
                        <div className="space-y-1 text-xs">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              title={event.title}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate border ${
                                event.type === 'exam'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30'
                                  : event.type === 'result'
                                    ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground px-1 font-semibold">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
