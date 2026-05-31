'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reminders } from '@/lib/db/schema'
import { and, eq, desc, lte } from 'drizzle-orm'
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const [reminder] = await db
    .insert(reminders)
    .values({
      ...data,
      userId,
    })
    .returning()

  // Send email notification via Resend to the logged-in user
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: session.user.email || '',
      subject: `Reminder Created: ${reminder.title}`,
      html: `<p>A reminder has been scheduled for <strong>${reminder.title}</strong> on ${reminder.reminderDate?.toLocaleString()}.</p>`,
    })
  } catch (e) {
    console.error('Failed to send reminder email', e)
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

export async function getPendingReminders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return []
  const userId = session.user.id
  const now = new Date()
  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.isNotified, false),
        lte(reminders.reminderDate, now)
      )
    )
}

export async function markReminderAsNotified(id: number) {
  const userId = await getUserId()
  const [reminder] = await db
    .update(reminders)
    .set({ isNotified: true })
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
    .returning()
  revalidatePath('/')
  return reminder
}

