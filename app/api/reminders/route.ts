import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getReminders, createReminder, updateReminder, deleteReminder } from '@/app/actions/reminders'

// Helper to get current user ID; throws if not authenticated
async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function GET() {
  try {
    const userId = await requireUserId()
    const reminders = await getReminders()
    return NextResponse.json(reminders)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireUserId()
    const data = await request.json()
    const reminder = await createReminder(data)
    // send email is handled inside createReminder via actions/reminders.ts
    return NextResponse.json(reminder, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireUserId()
    const { id, ...data } = await request.json()
    const reminder = await updateReminder(Number(id), data)
    return NextResponse.json(reminder)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireUserId()
    const { id } = await request.json()
    await deleteReminder(Number(id))
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
