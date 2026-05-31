# Production Setup Guide for StudyFlow

This guide walks you through setting up StudyFlow for production with all integrations.

## Prerequisites

- A Neon PostgreSQL database (already configured)
- Vercel account for deployment
- Google OAuth credentials
- Resend account for email sending

## Step 1: Environment Variables

Copy the `.env.example` file to `.env.local` and fill in all required values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

#### Database
- **DATABASE_URL**: Your Neon PostgreSQL connection string
  - Format: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`
  - Get this from Neon dashboard

#### Authentication
- **BETTER_AUTH_SECRET**: Generate with `openssl rand -base64 32`
  - This is used to sign session tokens
  - Must be the same across all instances
  
- **BETTER_AUTH_URL** (Production only):
  - Set to your production domain: `https://yourdomain.com`
  - Leave blank for Vercel to auto-detect

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google OAuth 2.0
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/google` (for development)
   - `http://localhost:3000/api/auth/callback/google` (for local dev)

- **NEXT_PUBLIC_GOOGLE_CLIENT_ID**: Your Google OAuth Client ID
- **NEXT_PUBLIC_GOOGLE_CLIENT_SECRET**: Your Google OAuth Client Secret

#### Email Service (Resend)
1. Sign up at [Resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your sending domain

- **RESEND_API_KEY**: Your Resend API key
- **EMAIL_FROM**: Your verified sender email (e.g., `noreply@yourdomain.com`)

#### App Configuration
- **NEXT_PUBLIC_APP_URL**: Your production URL
  - Example: `https://studyflow.vercel.app`
  - Used in email templates and redirects

#### Optional Vercel Variables (Auto-set)
- **VERCEL_PROJECT_PRODUCTION_URL**: Auto-set by Vercel
- **VERCEL_URL**: Auto-set by Vercel preview deployments
- **NODE_ENV**: Set by Vercel

## Step 2: Database Setup

1. **Create Neon Project**
   ```bash
   # Get DATABASE_URL from Neon dashboard
   ```

2. **Tables are automatically created** by Better Auth on first run
   - `user` - User accounts
   - `session` - Active sessions
   - `account` - OAuth connections
   - `verification` - Email verifications

3. **App tables are created** via the schema:
   - `subjects`
   - `tasks`
   - `exams`
   - `reminders`
   - `study_sessions`
   - `productivity_logs`
   - `notes`

## Step 3: Authentication Setup

### Email/Password Auth (Default)
- Already enabled in `lib/auth.ts`
- Users can sign up and sign in with email and password

### Google OAuth
- Already configured in `lib/auth.ts`
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Users can sign up/in with their Google account

## Step 4: Email Sending Setup

### Resend Integration
The app uses Resend for sending emails:

1. **Reminder Emails**
   - Sent when a reminder is created with `sendEmail: true`
   - Includes reminder details and CTA to dashboard
   - Uses HTML email templates

2. **Welcome Emails**
   - Optional: Call `sendWelcomeEmail()` in sign-up flow
   - Introduces user to StudyFlow features

### Testing Email
```typescript
import { sendReminderEmail } from '@/lib/email'

await sendReminderEmail({
  to: 'user@example.com',
  name: 'John Doe',
  title: 'Math Exam',
  reminderDate: new Date(),
  type: 'exam'
})
```

## Step 5: Scheduled Reminders (Cron Jobs)

The app includes a cron endpoint for automatic reminder sending:

### Setup Vercel Cron Jobs

1. Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. Add CRON_SECRET to environment:
   ```bash
   CRON_SECRET=your-random-secret-key
   ```

3. Set Authorization header in cron calls:
   - Vercel automatically adds `authorization: Bearer $CRON_SECRET`

### How It Works
- Runs every hour (adjust schedule as needed)
- Finds reminders due in the next hour that haven't been sent
- Sends emails via Resend
- Marks reminders as notified

Schedule options:
- `"0 * * * *"` - Every hour
- `"0 9 * * *"` - Daily at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours

## Step 6: Deployment to Vercel

1. **Connect GitHub Repository**
   ```bash
   git push
   ```

2. **Set Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Mark `NEXT_PUBLIC_*` as public

3. **Deploy**
   ```bash
   vercel deploy --prod
   ```

4. **Update OAuth Redirect URIs**
   - After deployment, update Google OAuth with your production domain

## Step 7: Testing Production Setup

### Test Authentication
```bash
# Visit your production URL
# Sign up with email
# Sign up with Google
# Verify session cookie is set
```

### Test Email Sending
```bash
# Create a reminder with sendEmail: true
# Check your email inbox
# Check Resend dashboard for delivery status
```

### Test Cron Jobs
```bash
# Visit https://yourdomain.com/api/cron/send-reminders?key=your-secret
# Should return JSON with sentCount
# Check Resend dashboard for emails sent
```

## Troubleshooting

### "Unauthorized" on Cron
- Check CRON_SECRET is set correctly
- Verify Bearer token is being passed

### Emails Not Sending
- Check RESEND_API_KEY is correct
- Verify EMAIL_FROM is a verified sender in Resend
- Check Resend dashboard for bounce/spam issues
- Look at server logs for error messages

### Google OAuth Not Working
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check Google Cloud Console for authorized redirect URIs
- Ensure domain is publicly accessible

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection limits
- Ensure IP whitelist allows Vercel IPs

## Security Checklist

- [ ] BETTER_AUTH_SECRET is a strong random string (32+ characters)
- [ ] CRON_SECRET is set and strong
- [ ] DATABASE_URL uses SSL/TLS (sslmode=require)
- [ ] All env vars are secrets (not committed to git)
- [ ] Google OAuth has authorized domains only
- [ ] Email sender domain is verified in Resend
- [ ] NEXT_PUBLIC_* vars contain no sensitive data

## Monitoring

### Check Dashboard Logs
- Vercel: Project → Deployments → View logs
- Watch for email sending errors
- Monitor cron job execution

### Email Monitoring
- Resend Dashboard → Check deliverability
- Set up bounce/complaint webhooks
- Monitor unsubscribe rates

### Database Monitoring
- Neon Dashboard → Monitoring
- Check connection pool usage
- Monitor query performance

## Support

For issues with:
- **Authentication**: Check Better Auth docs at https://better-auth.com
- **Email**: Check Resend docs at https://resend.com/docs
- **Database**: Check Neon docs at https://neon.tech/docs
- **Deployment**: Check Vercel docs at https://vercel.com/docs
