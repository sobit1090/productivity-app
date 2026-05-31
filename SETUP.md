# StudyFlow – Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL database (e.g. Neon, Supabase, or local)
- Google Cloud account (for OAuth)

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment Variables

Copy `.env` to `.env.local` and fill in your values:

```bash
cp .env .env.local
```

Edit `.env.local`:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<generate with: openssl rand -hex 32>
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

---

## 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use an existing one)
3. Enable the **Google+ API** or **Google Identity**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** into `.env.local`

---

## 4. Set Up the Database

Run migrations to create all required tables:

```bash
npm run db:push
# or
npx drizzle-kit push
```

This creates:
- `user`, `session`, `account`, `verification` (better-auth tables)
- `tasks`, `exams`, `subjects`, `reminders`, `study_sessions`, `notes`, `productivity_logs` (app tables)

---

## 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 6. Production Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all env variables in Vercel dashboard
4. Set `BETTER_AUTH_URL` to your production URL
5. Add production redirect URI to Google Cloud Console
6. Deploy

---

## Authentication Features

- ✅ Email + Password sign up / sign in
- ✅ Google OAuth (one-click sign in)
- ✅ Session management (7-day expiry)
- ✅ Password show/hide toggle
- ✅ Friendly error messages
- ✅ Auto-redirect if already signed in
- ✅ User avatar in header (uses Google profile photo if signed in with Google)
- ✅ Secure sign out
