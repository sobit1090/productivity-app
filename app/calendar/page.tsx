'use server'

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
    const date = format(new Date(exam.examDate), 'yyyy-MM-dd')
    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, [])
    }
    eventsByDate.get(date)?.push({ type: 'exam', title: exam.title })
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
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const dayEvents = eventsByDate.get(dateStr) || []
                    const isToday = format(today, 'yyyy-MM-dd') === dateStr

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-24 rounded-lg border p-2 ${
                          isToday
                            ? 'border-primary bg-primary/10'
                            : 'border-border'
                        }`}
                      >
                        <div className="mb-2 font-semibold">{format(day, 'd')}</div>
                        <div className="space-y-1 text-xs">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`rounded px-1 py-0.5 ${
                                event.type === 'exam'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {event.title.substring(0, 12)}
                              {event.title.length > 12 ? '...' : ''}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-muted-foreground">
                              +{dayEvents.length - 2} more
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
