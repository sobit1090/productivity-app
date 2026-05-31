# Sign-Up "Something Went Wrong" Error - Fix Guide

## Problem
When clicking "Create account" on the sign-up form, users see "Something went wrong" error message.

## Root Cause
**Missing or invalid `DATABASE_URL` environment variable**

The application requires a PostgreSQL database connection string (from Neon) to process user registrations. Without a valid `DATABASE_URL`, Better Auth cannot create user accounts in the database.

## Solution

### Step 1: Get Your Neon Database Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Sign in or create an account
3. Create a new project or select existing project
4. Go to "Connection Details"
5. Copy the **"Connection string"** (looks like: `postgresql://user:password@host:5432/dbname?sslmode=require`)

### Step 2: Set the Environment Variable

**In Development (Local)**:

Create or edit `.env.local` in the project root:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-here
```

Generate BETTER_AUTH_SECRET:
```bash
openssl rand -base64 32
```

**In Production (Vercel)**:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon connection string
3. Add `BETTER_AUTH_SECRET` with a secure random string
4. Click "Save"
5. Redeploy your application

### Step 3: Initialize Database Schema

After setting DATABASE_URL, the database tables are created automatically on first request, but you can manually initialize with:

```bash
# The schema is created automatically, but you can verify with:
psql $DATABASE_URL -f lib/db/schema.sql
```

### Step 4: Test Sign-Up

1. Restart your dev server: `pnpm dev`
2. Navigate to `/sign-up`
3. Fill in the form:
   - Name: Your name
   - Email: Your email
   - Password: Strong password
4. Click "Create account"

**Expected Result**: User account created, redirected to dashboard ✅

## Troubleshooting

### Error: "connect ECONNREFUSED"
- **Cause**: DATABASE_URL not set or invalid
- **Fix**: Verify DATABASE_URL is set and valid

### Error: "column 'userId' does not exist"
- **Cause**: Database tables not created
- **Fix**: The schema is auto-created on first request. Try again or manually run migrations.

### Error: "Invalid origin"
- **Cause**: Better Auth origin validation
- **Fix**: Fixed in latest version, add `http://localhost:3000` to trusted origins

## Environment Variables Checklist

- [ ] DATABASE_URL is set (from Neon)
- [ ] DATABASE_URL format is correct: `postgresql://...`
- [ ] BETTER_AUTH_SECRET is set (32+ character random string)
- [ ] Dev server restarted after adding variables
- [ ] Neon project is accessible (test connection)

## Testing Sign-Up Flow

```bash
# Start dev server
pnpm dev

# Open browser
open http://localhost:3000/sign-up

# Fill form and submit
# Should redirect to http://localhost:3000/dashboard after success
```

## More Resources

- [Neon Quickstart](https://neon.tech/docs/connect/connection-string)
- [Better Auth Docs](https://better-auth.docs)
- [Vercel Env Variables](https://vercel.com/docs/environment-variables)

## Need Help?

1. Check Neon dashboard for project status
2. Verify connection string includes: username, password, host, database
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
4. Check Vercel logs: `vercel logs --follow`

---

**Status**: Fixed ✅ (Requires valid DATABASE_URL)
