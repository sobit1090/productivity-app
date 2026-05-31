'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getNotes() {
  const userId = await getUserId()
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt))
}

export async function createNote(data: {
  title: string
  content?: string
  subjectId?: number
  imageUrl?: string
}) {
  const userId = await getUserId()
  const [note] = await db
    .insert(notes)
    .values({
      ...data,
      userId,
    })
    .returning()
  revalidatePath('/')
  return note
}

export async function updateNote(
  id: number,
  data: {
    title?: string
    content?: string
    subjectId?: number
    imageUrl?: string
  }
) {
  const userId = await getUserId()
  const [note] = await db
    .update(notes)
    .set(data)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning()
  revalidatePath('/')
  return note
}

export async function deleteNote(id: number) {
  const userId = await getUserId()
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
  revalidatePath('/')
}
