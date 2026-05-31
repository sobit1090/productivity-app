'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getTasks() {
  const userId = await getUserId()
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt))
}

export async function createTask(data: {
  title: string
  description?: string
  dueDate?: Date
  priority?: string
  subjectId?: number
}) {
  const userId = await getUserId()
  const [task] = await db
    .insert(tasks)
    .values({
      ...data,
      userId,
    })
    .returning()
  revalidatePath('/')
  return task
}

export async function updateTask(
  id: number,
  data: {
    title?: string
    description?: string
    dueDate?: Date
    priority?: string
    status?: string
    subjectId?: number
  }
) {
  const userId = await getUserId()
  const [task] = await db
    .update(tasks)
    .set(data)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
  revalidatePath('/')
  return task
}

export async function deleteTask(id: number) {
  const userId = await getUserId()
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  revalidatePath('/')
}
