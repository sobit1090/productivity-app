import { Resend } from 'resend'

// Initialize Resend safely - the API key might not be available during build
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is not set. Email sending will not work.'
    )
  }
  return new Resend(apiKey)
}

export const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

export interface SendReminderEmailProps {
  to: string
  name: string
  title: string
  reminderDate: Date
  reminderTime?: string
  type?: string
}

export async function sendReminderEmail({
  to,
  name,
  title,
  reminderDate,
  reminderTime,
  type,
}: SendReminderEmailProps) {
  try {
    const resend = getResend()
    const reminderType = type === 'exam' ? 'Exam' : 'Task'
    const formattedDate = reminderDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const time = reminderTime || 'No specific time set'

    const result = await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Reminder: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .title { color: #1f2937; font-size: 24px; margin: 0; }
              .badge { display: inline-block; background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
              .details { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
              .detail-row { margin: 8px 0; }
              .detail-label { color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; }
              .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
              .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 600; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">StudyFlow Reminder</h1>
                <span class="badge">${reminderType} Reminder</span>
              </div>

              <p>Hi ${name},</p>
              <p>This is a reminder for your upcoming ${reminderType.toLowerCase()}:</p>

              <div class="details">
                <div class="detail-row">
                  <div class="detail-label">Title</div>
                  <div class="detail-value">${title}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Date</div>
                  <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Time</div>
                  <div class="detail-value">${time}</div>
                </div>
              </div>

              <p>Make sure to review and prepare accordingly. Good luck!</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://studyflow.app'}/dashboard" class="cta-button">View in StudyFlow</a>

              <div class="footer">
                <p>This is an automated reminder from StudyFlow. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Failed to send reminder email:', result.error)
      throw new Error(`Email sending failed: ${result.error.message}`)
    }

    return result
  } catch (error) {
    console.error('Error sending reminder email:', error)
    throw error
  }
}

export interface SendWelcomeEmailProps {
  to: string
  name: string
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailProps) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: emailFrom,
      to,
      subject: 'Welcome to StudyFlow!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .title { font-size: 28px; margin: 0; font-weight: 700; }
              .subtitle { font-size: 14px; opacity: 0.9; margin-top: 8px; }
              .features { margin: 20px 0; }
              .feature { margin: 12px 0; padding: 10px; background-color: #f3f4f6; border-radius: 6px; border-left: 4px solid #3b82f6; }
              .feature-title { font-weight: 600; color: #1f2937; }
              .feature-desc { font-size: 13px; color: #6b7280; margin-top: 4px; }
              .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 600; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">Welcome to StudyFlow!</h1>
                <p class="subtitle">Your productivity companion for academic success</p>
              </div>

              <p>Hi ${name},</p>
              <p>Thank you for signing up for StudyFlow! We're excited to help you organize your tasks, exams, and study sessions.</p>

              <div class="features">
                <div class="feature">
                  <div class="feature-title">Task Management</div>
                  <div class="feature-desc">Create and track tasks with priorities and due dates</div>
                </div>
                <div class="feature">
                  <div class="feature-title">Exam Tracking</div>
                  <div class="feature-desc">Schedule exams and get reminders before the big day</div>
                </div>
                <div class="feature">
                  <div class="feature-title">Study Sessions</div>
                  <div class="feature-desc">Log your study time and track productivity</div>
                </div>
                <div class="feature">
                  <div class="feature-title">Analytics</div>
                  <div class="feature-desc">Visualize your progress with detailed insights</div>
                </div>
              </div>

              <p>Get started by creating your first task or exam!</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://studyflow.app'}/dashboard" class="cta-button">Go to Dashboard</a>

              <div class="footer">
                <p>If you have any questions, feel free to reach out to our support team.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Failed to send welcome email:', result.error)
      throw new Error(`Email sending failed: ${result.error.message}`)
    }

    return result
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}
