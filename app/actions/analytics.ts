'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks, exams, studySessions, productivityLogs } from '@/lib/db/schema'
import { eq, and, gte, lte, count } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getAnalytics() {
  const userId = await getUserId()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const recentLogs = await db
    .select()
    .from(productivityLogs)
    .where(
      and(
        eq(productivityLogs.userId, userId),
        gte(productivityLogs.date, thirtyDaysAgo.toISOString().split('T')[0])
      )
    )

  const [totalCountResult] = await db
    .select({ value: count() })
    .from(tasks)
    .where(eq(tasks.userId, userId))

  const [completedCountResult] = await db
    .select({ value: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, 'completed')
      )
    )

  const totalTasksCount = totalCountResult?.value ?? 0
  const completedTasksCount = completedCountResult?.value ?? 0

  return {
    totalTasks: totalTasksCount,
    completedTasks: completedTasksCount,
    completionRate:
      totalTasksCount > 0
        ? ((completedTasksCount / totalTasksCount) * 100).toFixed(1)
        : 0,
    recentLogs,
  }
}

export async function getStudySessionStats() {
  const userId = await getUserId()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const sessions = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.startTime, thirtyDaysAgo)
      )
    )

  const totalHours = sessions.reduce((acc, session) => {
    return acc + (session.duration || 0)
  }, 0)

  return {
    totalSessions: sessions.length,
    totalHours: (totalHours / 60).toFixed(1),
    sessions,
  }
}
