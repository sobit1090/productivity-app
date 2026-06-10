import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { getTasks } from '@/app/actions/tasks'
import { getExams } from '@/app/actions/exams'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

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
      if (!eventsByDate.has(date)) eventsByDate.set(date, [])
      eventsByDate.get(date)?.push({ type: 'task', title: task.title })
    }
  })

  exams.forEach(exam => {
    if (exam.examDate) {
      const date = format(new Date(exam.examDate), 'yyyy-MM-dd')
      if (!eventsByDate.has(date)) eventsByDate.set(date, [])
      eventsByDate.get(date)?.push({ type: 'exam', title: `📝 Exam: ${exam.title}` })
    }
    if (exam.resultDate) {
      const date = format(new Date(exam.resultDate), 'yyyy-MM-dd')
      if (!eventsByDate.has(date)) eventsByDate.set(date, [])
      const scoreStr = exam.score ? ` (${exam.score})` : ''
      eventsByDate.get(date)?.push({ type: 'result', title: `🏆 Result: ${exam.title}${scoreStr}` })
    }
  })

  // Year statistics
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startOfNextYear = new Date(today.getFullYear() + 1, 0, 1)
  const daysLeftThisYear = Math.ceil((startOfNextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const currentMonth = today.getMonth()
  const monthsLeft = 12 - (currentMonth + 1)
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  // Progress percentage for year
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysInYear = today.getFullYear() % 4 === 0 ? 366 : 365
  const yearProgress = Math.round((dayOfYear / daysInYear) * 100)

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <h1 className="text-3xl font-bold">Calendar</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* ── Main Calendar ── */}
              <div className="lg:col-span-9">
                <Card className="p-4 md:p-6">
                  <h2 className="mb-5 text-xl md:text-2xl font-bold">
                    {format(today, 'MMMM yyyy')}
                  </h2>

                  <div className="space-y-2">
                    {/* Weekdays header */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div
                          key={day}
                          className="py-1.5 text-center text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          {/* Show 1-letter on mobile, 3-letter on desktop */}
                          <span className="md:hidden">{day[0]}</span>
                          <span className="hidden md:inline">{day}</span>
                        </div>
                      ))}
                    </div>

                    {/* Calendar days grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {/* Empty offset cells */}
                      {Array.from({ length: startWeekday }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square md:aspect-auto md:min-h-24 rounded-lg border border-transparent bg-muted/10 opacity-30"
                        />
                      ))}

                      {/* Day cells */}
                      {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const dayEvents = eventsByDate.get(dateStr) || []
                        const isToday = format(today, 'yyyy-MM-dd') === dateStr
                        const isPast = day.getTime() < startOfToday
                        const isSaturday = day.getDay() === 6
                        const isSunday = day.getDay() === 0

                        // Dot indicators grouped by type (for mobile)
                        const hasTasks = dayEvents.some(e => e.type === 'task')
                        const hasExams = dayEvents.some(e => e.type === 'exam')
                        const hasResults = dayEvents.some(e => e.type === 'result')

                        let borderClass = 'border-border'
                        let bgClass = 'bg-card'
                        let textClass = 'text-foreground'

                        if (isToday) {
                          borderClass = 'border-primary ring-1 ring-primary/40'
                          bgClass = 'bg-primary/10'
                          textClass = 'text-primary font-bold'
                        } else if (isSunday) {
                          borderClass = 'border-red-200 dark:border-red-900/40'
                          bgClass = 'bg-red-100/20 dark:bg-red-950/25'
                          textClass = 'text-red-600 dark:text-red-400 font-semibold'
                        } else if (isSaturday) {
                          borderClass = 'border-red-200/50 dark:border-red-900/20'
                          bgClass = 'bg-red-50/25 dark:bg-red-950/10'
                          textClass = 'text-red-500/90 dark:text-red-400'
                        }

                        return (
                          <div
                            key={dateStr}
                            className={[
                              // Mobile: square tile | Desktop: tall rectangle
                              'aspect-square md:aspect-auto md:min-h-24',
                              'rounded-lg border p-1.5 md:p-2',
                              'flex flex-col items-center md:items-start justify-between',
                              'transition-colors relative overflow-hidden',
                              borderClass, bgClass, textClass,
                            ].join(' ')}
                          >
                            {/* ── Red cross overlay for past days ── */}
                            {isPast && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                                <span
                                  className="text-red-500 font-black leading-none"
                                  style={{
                                    fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
                                    opacity: 0.35,
                                    lineHeight: 1,
                                  }}
                                >
                                  ✕
                                </span>
                              </div>
                            )}

                            {/* Date number */}
                            <div className="text-[11px] md:text-xs font-semibold relative z-20 w-full">
                              <span className="block md:inline">{format(day, 'd')}</span>
                            </div>

                            {/* ── Mobile: dot indicators ── */}
                            {dayEvents.length > 0 && (
                              <div className="flex md:hidden gap-0.5 mt-auto flex-wrap justify-center relative z-20">
                                {hasExams && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Exam" />
                                )}
                                {hasResults && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Result" />
                                )}
                                {hasTasks && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Task" />
                                )}
                              </div>
                            )}

                            {/* ── Desktop: text event tags ── */}
                            <div className="hidden md:block space-y-1 text-xs w-full relative z-20 mt-1">
                              {dayEvents.slice(0, 3).map((event, i) => (
                                <div
                                  key={i}
                                  title={event.title}
                                  className={[
                                    'rounded px-1.5 py-0.5 text-[10px] font-medium truncate border',
                                    event.type === 'exam'
                                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30'
                                      : event.type === 'result'
                                        ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30',
                                  ].join(' ')}
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

                  {/* Legend (desktop only) */}
                  <div className="hidden md:flex items-center gap-4 mt-5 pt-4 border-t border-border/60 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> Exam
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Result
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Task
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto">
                      <span className="text-red-500 font-bold text-sm leading-none">✕</span> Past day
                    </span>
                  </div>
                </Card>
              </div>

              {/* ── Sidebar Stats ── */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="p-5 space-y-5">

                  {/* Year Overview header */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Year Overview
                    </h3>

                    {/* Year progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                        <span>{today.getFullYear()}</span>
                        <span>{yearProgress}% done</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${yearProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Days left */}
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-center">
                        <span className="block text-2xl font-extrabold text-amber-600 dark:text-amber-400 leading-none">
                          {daysLeftThisYear}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-1 block leading-tight">
                          days left
                        </span>
                      </div>

                      {/* Months left */}
                      <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3 text-center">
                        <span className="block text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                          {monthsLeft}<span className="text-base font-bold text-muted-foreground">/12</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-1 block leading-tight">
                          months left
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Months Tracker */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Months Tracker
                    </h3>
                    <div className="space-y-1">
                      {monthsList.map((mName, mIdx) => {
                        const isDone = mIdx < currentMonth
                        const isCurr = mIdx === currentMonth

                        return (
                          <div
                            key={mName}
                            className={[
                              'flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-xs',
                              isCurr
                                ? 'border-indigo-500/60 bg-indigo-500/8 font-semibold text-indigo-600 dark:text-indigo-400'
                                : isDone
                                  ? 'border-red-200/40 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 text-muted-foreground'
                                  : 'border-border bg-card/50 text-foreground/80',
                            ].join(' ')}
                          >
                            <span className="font-medium">{mName}</span>
                            {isDone ? (
                              <span className="text-red-500 font-bold text-base leading-none select-none">✕</span>
                            ) : isCurr ? (
                              <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                Now
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 text-[10px]">—</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                </Card>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
