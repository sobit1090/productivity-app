'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reminders } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { sendReminderEmail } from '@/lib/email'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserEmail() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.email) throw new Error('User email not found')
  return session.user.email
}

async function getUserName() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.name) throw new Error('User name not found')
  return session.user.name
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
  sendEmail?: boolean
}) {
  const userId = await getUserId()
  const [reminder] = await db
    .insert(reminders)
    .values({
      ...data,
      userId,
    })
    .returning()

  // Send email notification if enabled
  if (data.sendEmail) {
    try {
      const userEmail = await getUserEmail()
      const userName = await getUserName()
      await sendReminderEmail({
        to: userEmail,
        name: userName || 'User',
        title: data.title,
        reminderDate: data.reminderDate,
        reminderTime: data.reminderTime,
        type: data.type,
      })
    } catch (error) {
      console.error('Failed to send reminder email:', error)
      // Don't fail the reminder creation if email fails
    }
  }

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
