# Production Deployment Checklist

Use this checklist to ensure your production deployment is secure and working correctly.

## Pre-Deployment

### Database Setup
- [ ] Neon PostgreSQL database created
- [ ] DATABASE_URL connection string obtained
- [ ] Database tables created (auto-created on first run)
- [ ] Database backups configured in Neon
- [ ] Connection pooling enabled (if needed)

### Authentication Setup
- [ ] BETTER_AUTH_SECRET generated (`openssl rand -base64 32`)
- [ ] BETTER_AUTH_SECRET is 32+ characters
- [ ] BETTER_AUTH_SECRET saved securely (KeePass/1Password)
- [ ] Email/password auth tested locally
- [ ] Google OAuth credentials created (if using)
- [ ] Google OAuth redirect URIs configured
- [ ] Google OAuth client ID and secret obtained

### Email Setup
- [ ] Resend account created
- [ ] RESEND_API_KEY obtained from dashboard
- [ ] Email sender domain verified in Resend
- [ ] EMAIL_FROM set to verified sender
- [ ] Email templates reviewed in `/lib/email.ts`
- [ ] Test email sent successfully locally

### App Configuration
- [ ] Production domain registered
- [ ] HTTPS certificate ready
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] Analytics service configured (if using)

### Code Quality
- [ ] No console.log() debug statements in production code
- [ ] No hardcoded secrets in code
- [ ] TypeScript compiles without errors
- [ ] Linting passes (`pnpm lint`)
- [ ] All dependencies up to date
- [ ] Build succeeds locally (`pnpm run build`)

## Vercel Deployment

### Repository Setup
- [ ] GitHub repository created
- [ ] `.env.local` added to `.gitignore`
- [ ] `.env.example` committed to repo
- [ ] vercel.json configured for cron jobs

### Vercel Project
- [ ] Vercel account created
- [ ] GitHub repo connected to Vercel
- [ ] Production domain configured
- [ ] Custom domain connected (if not using vercel.app)

### Environment Variables
- [ ] All required env vars added to Vercel dashboard:
  - [ ] DATABASE_URL
  - [ ] BETTER_AUTH_SECRET
  - [ ] RESEND_API_KEY
  - [ ] EMAIL_FROM
  - [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID (if using OAuth)
  - [ ] NEXT_PUBLIC_GOOGLE_CLIENT_SECRET (if using OAuth)
  - [ ] CRON_SECRET (if using cron jobs)
  - [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_* marked as public
- [ ] All others marked as secret/private
- [ ] Database connection tested from Vercel environment

### Deploy
- [ ] Initial deployment successful
- [ ] Deployment logs checked for errors
- [ ] Build time acceptable (< 5 minutes)

## Post-Deployment Testing

### Access & Routing
- [ ] Production domain accessible
- [ ] HTTPS working (lock icon in browser)
- [ ] All routes working:
  - [ ] /sign-in
  - [ ] /sign-up
  - [ ] /dashboard
  - [ ] /tasks
  - [ ] /exams
  - [ ] /calendar
  - [ ] /analytics
  - [ ] /notes
  - [ ] /study-sessions

### Authentication
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Session persists after refresh
- [ ] Logout works
- [ ] Google OAuth signup works (if enabled)
- [ ] Google OAuth login works (if enabled)
- [ ] Protected routes redirect to /sign-in when logged out

### Database
- [ ] Data saves to database
- [ ] User data scoped correctly (can't see other users' data)
- [ ] Dashboard loads without errors
- [ ] Analytics page renders charts
- [ ] Filtering and sorting work

### Email
- [ ] Welcome email sent on signup (if enabled)
- [ ] Reminder creation allows email option
- [ ] Email sent when reminder created with email enabled
- [ ] Email content renders correctly
- [ ] Links in email work
- [ ] Check Resend dashboard for delivery status

### Cron Jobs (if enabled)
- [ ] vercel.json has cron configuration
- [ ] CRON_SECRET environment variable set
- [ ] Test cron endpoint: `curl https://yourdomain.com/api/cron/send-reminders?key=your-secret`
- [ ] Should return JSON with sentCount
- [ ] Verify emails sent from cron job

### Performance
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 80
- [ ] Core Web Vitals good
- [ ] No console errors in production

## Security Checklist

### Secrets & Keys
- [ ] No secrets in `.env.example`
- [ ] No secrets in git history
- [ ] All API keys rotated since development
- [ ] BETTER_AUTH_SECRET different from dev
- [ ] CRON_SECRET different from other secrets
- [ ] 2FA enabled on all accounts (Vercel, Neon, Resend, Google)

### Database
- [ ] DATABASE_URL uses SSL/TLS (sslmode=require)
- [ ] Database backups enabled and tested
- [ ] Only Vercel and your IP can access database
- [ ] Query logging disabled (for performance)
- [ ] Old backups cleaned up regularly

### Authentication
- [ ] Session timeout configured (7 days default)
- [ ] Cookies marked as secure in production
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints (consider adding)
- [ ] Account lockout after failed attempts (optional)

### API & Routes
- [ ] Protected routes require authentication
- [ ] Server actions validate userId
- [ ] No sensitive data in API responses
- [ ] CORS properly configured (if needed)
- [ ] Rate limiting on public endpoints

### Email
- [ ] EMAIL_FROM is verified domain
- [ ] Email templates don't expose user secrets
- [ ] Unsubscribe mechanism implemented (optional)
- [ ] SPF/DKIM records configured
- [ ] Reply-To header set appropriately

### Monitoring
- [ ] Error reporting enabled (Sentry/Vercel)
- [ ] Uptime monitoring enabled (Pingdom/Vercel)
- [ ] Alerts configured for failures
- [ ] Email delivery monitoring enabled (Resend)
- [ ] Log retention configured (30 days)

## Ongoing Maintenance

### Weekly
- [ ] Check Vercel deployment logs for errors
- [ ] Check Resend dashboard for bounces
- [ ] Monitor database connection pool
- [ ] Test core functionality manually

### Monthly
- [ ] Update dependencies (`pnpm update`)
- [ ] Review error logs and fix issues
- [ ] Check Lighthouse scores
- [ ] Verify backups are working
- [ ] Review analytics for anomalies

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Update documentation
- [ ] Test disaster recovery
- [ ] Review and rotate secrets

### Annually
- [ ] SSL certificate renewal (auto with Vercel)
- [ ] Major dependency updates
- [ ] Code refactoring and cleanup
- [ ] Capacity planning
- [ ] Compliance review

## Rollback Plan

If something goes wrong:

1. **Immediate**
   - Revert last deployment: Vercel Dashboard → Deployments → Click previous successful build
   - Takes ~30 seconds
   - No data loss

2. **If Database Issue**
   - Check Neon dashboard for errors
   - Use Neon backups to restore (1 hour ago, 1 day ago, etc.)
   - Contact Neon support if needed

3. **If Email Broken**
   - Check Resend API key
   - Check EMAIL_FROM is verified
   - Fall back to disabling email temporarily
   - Fix and redeploy

4. **Communication**
   - Update status page
   - Notify users if outage > 1 hour
   - Post incident report when resolved

## Troubleshooting

### Build Fails
- Check build logs in Vercel
- Run `pnpm run build` locally to reproduce
- Check for missing environment variables
- Check for TypeScript errors

### Authentication Not Working
- Verify BETTER_AUTH_SECRET is set
- Check database connection
- Review auth error logs
- Test Google OAuth credentials if using OAuth

### Email Not Sending
- Check RESEND_API_KEY is correct
- Verify EMAIL_FROM is verified in Resend
- Check Resend dashboard for bounces
- Review server logs for error messages

### Cron Jobs Not Running
- Verify CRON_SECRET is set
- Check vercel.json crons configuration
- Test endpoint manually with curl
- Check Vercel cron logs

### Database Connection Issues
- Verify DATABASE_URL format
- Check Neon connection limits
- Verify IP whitelist (allow all for Vercel)
- Test connection locally with psql

## Success Criteria

Your production deployment is successful when:

✅ All routes load without errors
✅ Authentication works (email and OAuth)
✅ Data saves and loads correctly
✅ Emails send successfully
✅ Cron jobs execute (if enabled)
✅ Performance metrics are good
✅ No console errors in browser
✅ All security measures in place
✅ Monitoring and alerts configured
✅ Team trained on incident response

Congratulations! Your StudyFlow is production-ready.
