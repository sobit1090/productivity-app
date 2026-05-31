'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subjects } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getSubjects() {
  const userId = await getUserId()
  return db
    .select()
    .from(subjects)
    .where(eq(subjects.userId, userId))
}

export async function createSubject(data: {
  name: string
  color?: string
}) {
  const userId = await getUserId()
  const [subject] = await db
    .insert(subjects)
    .values({
      ...data,
      userId,
    })
    .returning()
  revalidatePath('/')
  return subject
}

export async function updateSubject(
  id: number,
  data: {
    name?: string
    color?: string
  }
) {
  const userId = await getUserId()
  const [subject] = await db
    .update(subjects)
    .set(data)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
    .returning()
  revalidatePath('/')
  return subject
}

export async function deleteSubject(id: number) {
  const userId = await getUserId()
  await db
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
  revalidatePath('/')
}

