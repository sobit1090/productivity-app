'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reminders } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getReminders() {
  const userId = await getUserId()
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(desc(reminders.reminderDate))
}

export async function createReminder(data: {
  title: string
  reminderDate: Date
  reminderTime?: string
  type?: string
  taskId?: number
  examId?: number
}) {
  const userId = await getUserId()
  const [reminder] = await db
    .insert(reminders)
    .values({
      ...data,
      userId,
    })
    .returning()
  revalidatePath('/')
  return reminder
}

export async function updateReminder(
  id: number,
  data: {
    isNotified?: boolean
    title?: string
    reminderDate?: Date
  }
) {
  const userId = await getUserId()
  const [reminder] = await db
    .update(reminders)
    .set(data)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
    .returning()
  revalidatePath('/')
  return reminder
}

export async function deleteReminder(id: number) {
  const userId = await getUserId()
  await db
    .delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
  revalidatePath('/')
}
