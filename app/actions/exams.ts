'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { exams } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getExams() {
  const userId = await getUserId()
  return db
    .select()
    .from(exams)
    .where(eq(exams.userId, userId))
    .orderBy(desc(exams.examDate))
}

export async function createExam(data: {
  title: string
  description?: string
  examDate: Date
  duration?: number
  location?: string
  syllabus?: string
  subjectId?: number
  formDeadline?: Date
  admitCardLink?: string
  admitCardStatus?: string
}) {
  const userId = await getUserId()
  const [exam] = await db
    .insert(exams)
    .values({
      ...data,
      userId,
    })
    .returning()
  revalidatePath('/')
  return exam
}

export async function updateExam(
  id: number,
  data: {
    title?: string
    description?: string
    examDate?: Date
    duration?: number
    location?: string
    syllabus?: string
    status?: string
    subjectId?: number
    formDeadline?: Date
    admitCardLink?: string
    admitCardStatus?: string
  }
) {
  const userId = await getUserId()
  const [exam] = await db
    .update(exams)
    .set(data)
    .where(and(eq(exams.id, id), eq(exams.userId, userId)))
    .returning()
  revalidatePath('/')
  return exam
}

export async function deleteExam(id: number) {
  const userId = await getUserId()
  await db
    .delete(exams)
    .where(and(eq(exams.id, id), eq(exams.userId, userId)))
  revalidatePath('/')
}
