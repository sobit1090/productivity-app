'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { studySessions } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getStudySessions() {
  const userId = await getUserId()
  return db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(studySessions.startTime))
}

export async function createStudySession(data: {
  title: string
  subjectId?: number
  startTime: Date
  endTime?: Date
  notes?: string
}) {
  const userId = await getUserId()
  
  const duration = data.endTime && data.startTime
    ? Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))
    : undefined

  const [session] = await db
    .insert(studySessions)
    .values({
      ...data,
      userId,
      duration,
    })
    .returning()
  revalidatePath('/')
  return session
}

export async function deleteStudySession(id: number) {
  const userId = await getUserId()
  await db
    .delete(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, userId)))
  revalidatePath('/')
}
