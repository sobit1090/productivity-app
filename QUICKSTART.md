# StudyFlow Quick Start Guide

Get StudyFlow up and running in 5 minutes.

## Local Development

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

```env
# Required for local development
DATABASE_URL=your-neon-database-url
BETTER_AUTH_SECRET=your-random-secret-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

Generate a strong secret:
```bash
openssl rand -base64 32
```

### 3. Create Database Tables
The tables are created automatically by Better Auth and Drizzle on first run.

To verify the connection:
```bash
pnpm run build
```

### 4. Start Development Server
```bash
pnpm run dev
```

Visit http://localhost:3000

### 5. Create Your First Account
- Click "Sign Up"
- Enter email and password
- You're all set!

## Features to Try

### Create a Task
1. Go to Dashboard → Tasks
2. Click "New Task"
3. Fill in title, description, due date, priority
4. Click "Create"

### Schedule an Exam
1. Go to Dashboard → Exams
2. Click "New Exam"
3. Fill in exam details with date and time
4. Optionally enable email reminder
5. Click "Create"

### View Analytics
1. Go to Analytics in the sidebar
2. See your completion rate and productivity stats
3. Charts are interactive

### Set Reminders
1. When creating a task or exam, enable "Send email reminder"
2. We'll email you before the deadline using Resend

## Environment Variables Reference

### Required
- **DATABASE_URL** - Neon PostgreSQL connection
- **BETTER_AUTH_SECRET** - Session signing key (32+ chars)
- **RESEND_API_KEY** - Email service API key
- **EMAIL_FROM** - Sender email address

### Optional (Production)
- **BETTER_AUTH_URL** - Production domain
- **NEXT_PUBLIC_GOOGLE_CLIENT_ID** - Google OAuth ID
- **NEXT_PUBLIC_GOOGLE_CLIENT_SECRET** - Google OAuth secret
- **NEXT_PUBLIC_APP_URL** - Production app URL

## Deployment

### Deploy to Vercel
```bash
# Connect your GitHub repo to Vercel
vercel --prod

# Or push to main branch and Vercel auto-deploys
git push origin main
```

### Add Environment Variables
1. Go to Vercel Dashboard → Project Settings
2. Environment Variables
3. Add all from `.env.local`
4. Mark `NEXT_PUBLIC_*` as public

### Enable Cron Jobs (Optional)
1. Uncomment crons in `vercel.json`
2. Add `CRON_SECRET` environment variable
3. Deploy - cron jobs run automatically

## Common Tasks

### Change Email Template
Edit `/lib/email.ts`:
- `sendReminderEmail()` - Reminder emails
- `sendWelcomeEmail()` - Welcome emails

### Add Google Sign-In
1. Create Google OAuth credentials
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
   NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=...
   ```
3. Restart dev server

### Troubleshoot Database Connection
```bash
# Test connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1', (err, res) => {
  console.log(err || 'Connected!');
  pool.end();
});
"
```

### Troubleshoot Email Sending
Check `/lib/email.ts` error handling, or visit Resend dashboard to see delivery status.

## Project Structure

```
/app
  /api            - API routes and cron jobs
  /actions        - Server actions for database
  /dashboard      - Main app routes
  /sign-in        - Authentication pages
/lib
  /auth.ts        - Better Auth config
  /db/            - Database schema and client
  /email.ts       - Resend email service
/components       - React components
/public           - Static assets
```

## Next Steps

- Customize the UI in `/components`
- Add more features by creating tasks
- Deploy to production
- Monitor with Vercel Analytics

## Support

- **Docs**: https://docs.studyflow.com
- **Issues**: GitHub Issues
- **Email**: support@studyflow.com
