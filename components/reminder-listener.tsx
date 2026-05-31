'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { getPendingReminders, markReminderAsNotified } from '@/app/actions/reminders'

export function ReminderListener() {
  useEffect(() => {
    // Request browser notification permissions on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    const checkReminders = async () => {
      try {
        const pending = await getPendingReminders()
        if (pending && pending.length > 0) {
          for (const reminder of pending) {
            // Trigger native browser notification
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              new Notification(`Reminder: ${reminder.title}`, {
                body: reminder.reminderTime
                  ? `Scheduled for ${reminder.reminderTime}`
                  : 'Time to complete your scheduled task/exam.',
                icon: '/icon.svg',
              })
            }

            // Trigger sonner toast alert
            toast.info(`Reminder: ${reminder.title}`, {
              description: reminder.reminderTime
                ? `Scheduled for ${reminder.reminderTime}`
                : 'Time to complete your scheduled task/exam.',
              duration: 10000,
            })

            // Mark as notified in DB
            await markReminderAsNotified(reminder.id)
          }
        }
      } catch (e) {
        console.error('Error polling reminders:', e)
      }
    }

    // Run initial check and then poll every 15 seconds
    checkReminders()
    const interval = setInterval(checkReminders, 15000)

    return () => clearInterval(interval)
  }, [])

  return null
}
