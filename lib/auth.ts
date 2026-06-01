import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const appURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

const fromEmail = process.env.EMAIL_FROM || 'StudyFlow <onboarding@resend.dev>'

export const auth = betterAuth({
  database: pool,
  baseURL: appURL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,

    // Send verification email on sign up
    requireEmailVerification: false, // keep false so users can still log in unverified
  },

  emailVerification: {
    sendOnSignUp: true, // auto send verification email when user signs up
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'Verify your StudyFlow email',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
              <div style="background: #18181b; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 14px;">S</span>
              </div>
              <span style="font-size: 18px; font-weight: 700; color: #18181b;">StudyFlow</span>
            </div>

            <h1 style="font-size: 22px; font-weight: 700; color: #18181b; margin: 0 0 8px;">Verify your email address</h1>
            <p style="color: #71717a; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
              Hi ${user.name || 'there'}, thanks for signing up! Click the button below to verify your email address and secure your account.
            </p>

            <a href="${url}"
              style="display: inline-block; background: #18181b; color: #ffffff; font-weight: 600; font-size: 15px;
                     text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-bottom: 28px;">
              Verify Email Address
            </a>

            <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 4px;">
              This link expires in 24 hours. If you didn't create a StudyFlow account, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 28px 0;" />
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              StudyFlow · Productivity & Exam Tracker
            </p>
          </div>
        `,
      })
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  trustedOrigins: [
    'http://localhost:3000',
    appURL,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  },
})
