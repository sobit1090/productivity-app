# Environment Variables Setup Guide

Complete step-by-step guide to setting up all required environment variables for StudyFlow.

## 1. Database Setup (Neon PostgreSQL)

### Get Your DATABASE_URL

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project (if not already done)
3. Go to "Connection String" tab
4. Copy the connection string with password
5. Format: `postgresql://user:password@host:5432/database?sslmode=require`

### Test Database Connection

```bash
# Test locally
psql "postgresql://user:password@host:5432/database?sslmode=require" -c "SELECT 1"

# Should output: 1
```

### Add to .env.local

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

---

## 2. Authentication Secrets

### Generate BETTER_AUTH_SECRET

This is a random secret used to sign session tokens. Must be 32+ characters.

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

Example output:
```
V8u3M2nK9pL4qW7xY1aB5cD8eF0gH3jK6m9nO2pR5sT8u
```

### Save to .env.local

```env
BETTER_AUTH_SECRET=V8u3M2nK9pL4qW7xY1aB5cD8eF0gH3jK6m9nO2pR5sT8u
BETTER_AUTH_URL=https://your-domain.com
```

---

## 3. Email Service (Resend)

### Create Resend Account

1. Go to [Resend.com](https://resend.com)
2. Sign up with email
3. Verify email
4. Go to API Keys dashboard

### Get Your RESEND_API_KEY

1. Click "Create API Key"
2. Copy the key (starts with `re_`)
3. Keep it secret - never commit to git

### Verify Your Sending Domain

1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `noreply@yourdomain.com`)
3. Follow DNS setup instructions
4. Verify domain ownership with DNS records

### What You Need

- RESEND_API_KEY: Your API key from Resend
- EMAIL_FROM: Your verified sender email

### Add to .env.local

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

---

## 4. Google OAuth (Optional but Recommended)

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Search for "Google+ API"
   - Click "Enable"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add Authorized redirect URIs:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/google
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/google
```

7. Copy the Client ID and Client Secret

### Add to .env.local

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
```

---

## 5. App Configuration

### NEXT_PUBLIC_APP_URL

This is your production domain URL. Used in:
- Email templates
- OAuth redirects
- Analytics tracking

### For Local Development

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (Vercel)

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

---

## 6. Cron Jobs (Optional but Recommended)

### Generate CRON_SECRET

Similar to BETTER_AUTH_SECRET, a random secure string.

```bash
openssl rand -base64 32
```

### Add to .env.local

```env
CRON_SECRET=A9b2C5dE8fG1hI4jK7lM0nO3pQ6rS9tU
```

---

## Complete .env.local File

Create `.env.local` in your project root:

```env
# ===== DATABASE =====
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# ===== AUTHENTICATION =====
BETTER_AUTH_SECRET=V8u3M2nK9pL4qW7xY1aB5cD8eF0gH3jK6m9nO2pR5sT8u
BETTER_AUTH_URL=https://yourdomain.com

# ===== EMAIL SERVICE =====
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# ===== GOOGLE OAUTH =====
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx

# ===== APP CONFIGURATION =====
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== CRON JOBS =====
CRON_SECRET=A9b2C5dE8fG1hI4jK7lM0nO3pQ6rS9tU
```

---

## Vercel Production Setup

### Add Environment Variables to Vercel

1. Go to **Vercel Dashboard** → **Your Project**
2. Go to **Settings** → **Environment Variables**
3. Add each variable one by one:

```
DATABASE_URL = (same as .env.local)
BETTER_AUTH_SECRET = (same as .env.local)
BETTER_AUTH_URL = https://your-production-domain.com
RESEND_API_KEY = (same as .env.local)
EMAIL_FROM = (same as .env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID = (same as .env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET = (same as .env.local)
NEXT_PUBLIC_APP_URL = https://your-production-domain.com
CRON_SECRET = (same as .env.local)
```

### Mark Public Variables

These should be marked as **Public** (not secret):
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_APP_URL`

All others should be **Secret**.

### Deploy

After adding variables, redeploy:

```bash
vercel --prod
```

---

## Testing Environment Variables

### Local Development

```bash
# Start dev server
pnpm run dev

# Check if variables are loaded
# Visit http://localhost:3000
# Should load without errors
```

### Test Database Connection

```bash
# Using psql
psql "$DATABASE_URL" -c "SELECT 1"

# Or in Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1', (err, res) => {
  console.log(err || 'Connected!');
  process.exit(0);
});
"
```

### Test Email Service

When you create a reminder with `sendEmail: true`:
1. Check your email inbox
2. Go to [Resend Dashboard](https://resend.com/emails)
3. Verify email was delivered

### Test Cron Job

```bash
curl "https://yourdomain.com/api/cron/send-reminders" \
  -H "Authorization: Bearer $CRON_SECRET"

# Should return JSON with sentCount
```

---

## Security Best Practices

### ✅ DO

- Generate strong random secrets with `openssl rand -base64 32`
- Store secrets in password manager (1Password, LastPass, etc)
- Use different secrets for development and production
- Rotate secrets periodically (monthly)
- Never commit `.env.local` to git
- Use `.gitignore` to exclude env files

### ❌ DON'T

- Don't use weak or predictable secrets
- Don't share secrets in email or Slack
- Don't use the same secret in dev and production
- Don't commit `.env.local` to git
- Don't log environment variables
- Don't expose secrets in error messages

### .gitignore Entry

Make sure `.env.local` is in your `.gitignore`:

```
# .gitignore
.env.local
.env.*.local
```

---

## Troubleshooting

### "DATABASE_URL is not set"

- Make sure DATABASE_URL is in `.env.local`
- Verify the connection string format
- Check for typos in the URL

### "RESEND_API_KEY missing"

- Make sure RESEND_API_KEY is in `.env.local`
- Verify the key starts with `re_`
- Check that you copied the full key

### "BETTER_AUTH_SECRET is invalid"

- Make sure BETTER_AUTH_SECRET is 32+ characters
- Regenerate with `openssl rand -base64 32`
- Verify it doesn't have special URL characters

### "Google OAuth not working"

- Check that NEXT_PUBLIC_GOOGLE_CLIENT_ID is set
- Verify the redirect URI in Google Cloud Console matches your domain
- Check browser console for auth errors

### "Emails not sending"

- Verify RESEND_API_KEY is correct
- Check that EMAIL_FROM is a verified domain
- Go to Resend dashboard to see delivery status
- Check spam folder

---

## Production Deployment Checklist

Before going to production:

- [ ] All 9 environment variables set
- [ ] Secrets are different from development
- [ ] Database connection tested
- [ ] Email service tested
- [ ] Google OAuth credentials verified (if using)
- [ ] .env.local is in .gitignore
- [ ] Production build passes: `pnpm run build`
- [ ] Variables added to Vercel dashboard
- [ ] NEXT_PUBLIC_* marked as public
- [ ] Deployment successful

---

## Getting Help

If you encounter issues:

1. Check [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Detailed setup guide
2. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Troubleshooting section
3. Visit service documentation:
   - [Neon Docs](https://neon.tech/docs)
   - [Resend Docs](https://resend.com/docs)
   - [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
   - [Better Auth Docs](https://better-auth.com/docs)

---

## Summary

Your environment is set up correctly when:

✅ `pnpm run dev` starts without errors
✅ `http://localhost:3000` loads
✅ You can sign up and login
✅ Emails send without errors
✅ `pnpm run build` succeeds
✅ Vercel deployment succeeds

Congratulations! You're ready to use StudyFlow! 🎉
