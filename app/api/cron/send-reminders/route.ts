import { db } from '@/lib/db'
import { reminders } from '@/lib/db/schema'
import { sendReminderEmail } from '@/lib/email'
import { eq, and, lte, gte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// This endpoint is designed to be called by Vercel Cron Jobs
// Configure it in vercel.json: "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 * * * *" }]
export async function GET(request: Request) {
  // Verify the request is from Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current time
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    // Find reminders that should be sent in the next hour and haven't been notified
    const upcomingReminders = await db.query.reminders.findMany({
      where: and(
        eq(reminders.isNotified, false),
        gte(reminders.reminderDate, now),
        lte(reminders.reminderDate, oneHourLater)
      ),
      with: {
        // We would need to add relations in schema to fetch user data
      },
    })

    let sentCount = 0
    const errors: string[] = []

    for (const reminder of upcomingReminders) {
      try {
        // Get user data from the database
        const userResult = await db.execute(
          sql`SELECT id, email, name FROM "neon_auth"."user" WHERE id = ${reminder.userId}`
        )

        if (userResult.rows && userResult.rows.length > 0) {
          const user = userResult.rows[0] as {
            id: string
            email: string
            name: string
          }

          // Send email
          await sendReminderEmail({
            to: user.email,
            name: user.name || 'User',
            title: reminder.title,
            reminderDate: reminder.reminderDate,
            reminderTime: reminder.reminderTime,
            type: reminder.type,
          })

          // Mark as notified
          await db
            .update(reminders)
            .set({ isNotified: true })
            .where(eq(reminders.id, reminder.id))

          sentCount++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`Reminder ${reminder.id}: ${errorMsg}`)
        console.error(`Failed to send reminder ${reminder.id}:`, error)
      }
    }

    return Response.json({
      success: true,
      sentCount,
      totalReminders: upcomingReminders.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return Response.json(
      {
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Prevent timeouts - set a 60 second timeout
export const maxDuration = 60
