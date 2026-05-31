# Senior Production Audit & Full Refactor Plan

This plan aims to address build failures, security concerns, runtime bugs, and functional gaps in the productivity + government exam tracking application. By implementing senior engineering patterns, the application will be stabilized for local development and Vercel production deployment.

## User Review Required

> [!IMPORTANT]
> **Database Schema Updates**: We are adding three new fields (`formDeadline`, `admitCardLink`, and `admitCardStatus`) to the `exams` table to support Admit Card & Form Deadline tracking. You will need to run the schema sync command (`npx drizzle-kit push` or `npx drizzle-kit migrate`) after this plan is executed.

> [!WARNING]
> **Better Auth Database Pool Sharing**: We are modifying `lib/auth.ts` to import the database pool directly from `lib/db/index.ts`. This reduces active connection pools from two to one, solving potential pool limits in production/serverless environments.

---

## Proposed Changes

### Configuration & Database

#### [NEW] [drizzle.config.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/drizzle.config.ts)
- Create a standard Drizzle Kit configuration to support migrations and schema syncing.

#### [MODIFY] [lib/db/index.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/lib/db/index.ts)
- Implement a global pool caching pattern to prevent pool leakage during development hot-reloads.

#### [MODIFY] [lib/auth.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/lib/auth.ts)
- Share the database connection pool from `lib/db/index.ts` instead of instantiating a separate client.

#### [MODIFY] [lib/db/schema.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/lib/db/schema.ts)
- Add tracking fields to the `exams` table:
  - `formDeadline`: timestamp
  - `admitCardLink`: text
  - `admitCardStatus`: text (default: `'pending'`)

---

### Pages & Layouts (Fixing `'use server'` & Layouts)

#### [MODIFY] [app/layout.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/layout.tsx)
- Integrate `ThemeProvider` to support theme synchronization.
- Include the `Toaster` component from `@/components/ui/sonner` to support toast notifications.
- Include the new `<ReminderListener />` component to handle active browser reminders.
- Attach Geist font variables properly to resolve font load warnings.

#### [MODIFY] [app/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/page.tsx)
- Remove `'use server'` directive from the top of the page component.

#### [MODIFY] [app/dashboard/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/dashboard/page.tsx)
- Remove `'use server'` directive from the top of the page component.

#### [MODIFY] [app/exams/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/exams/page.tsx)
- Remove `'use server'` directive from the top of the page component.
- Pass user subjects down to `CreateExamForm` for categorizing.

#### [MODIFY] [app/tasks/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/tasks/page.tsx)
- Remove `'use server'` directive from the top of the page component.
- Pass user subjects down to `CreateTaskForm`.

#### [MODIFY] [app/notes/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/notes/page.tsx)
- Remove `'use server'` directive from the top of the page component.
- Integrate the new `<CreateNoteForm />` component.
- Add Note Card actions (such as deletion).

#### [MODIFY] [app/study-sessions/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/study-sessions/page.tsx)
- Remove `'use server'` directive from the top of the page component.
- Integrate the new `<CreateSessionForm />` component.

#### [MODIFY] [app/calendar/page.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/calendar/page.tsx)
- Remove `'use server'` directive from the top of the page component.
- Fix calendar layout offset by inserting empty cells corresponding to the first weekday of the month.

---

### Actions & Safety Policies

#### [MODIFY] [app/actions/subjects.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/actions/subjects.ts)
- Add user-ownership protection (`eq(subjects.userId, userId)`) on update and delete actions to patch the security vulnerability.

#### [MODIFY] [app/actions/reminders.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/actions/reminders.ts)
- Fix email delivery target: read from the authenticated user's session (`session.user.email`) instead of `reminder.email` (which is undefined).
- Expose `getPendingReminders()` and `markReminderAsNotified(id)` server actions.

#### [MODIFY] [app/actions/analytics.ts](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/app/actions/analytics.ts)
- Clean up unused destructured variables (`taskStats`) to prevent compilation warnings/lint errors.
- Optimize analytics metrics queries by removing redundant/incorrect `.selectDistinct()` calls.

---

### UI/UX & Components

#### [NEW] [components/reminder-listener.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/reminder-listener.tsx)
- Request notification permissions on mount.
- Poll active reminders via client-side intervals.
- Trigger native browser notifications and toast feedback, then update their notified status.

#### [NEW] [components/create-note-form.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/create-note-form.tsx)
- Create a modal dialog to allow creating new notes and categorizing them under subjects.

#### [NEW] [components/create-session-form.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/create-session-form.tsx)
- Create a dialog to easily log study sessions with durations and associated subjects.

#### [MODIFY] [components/task-card.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/task-card.tsx)
- Use standard `cn` helper from `lib/utils` instead of manual implementation.
- Add visual indicators for overdue tasks (red font/borders) when due dates have passed and status is pending.

#### [MODIFY] [components/exam-card.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/exam-card.tsx)
- Display Admit Card and Form Deadline details.
- Flag approaching deadlines with alert formatting.

#### [MODIFY] [components/dashboard-header.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/dashboard-header.tsx)
- Build a responsive hamburger menu utilizing a mobile Sheet component so users can navigate pages on mobile devices.

#### [MODIFY] [components/create-task-form.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/create-task-form.tsx) & [components/create-exam-form.tsx](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/components/create-exam-form.tsx)
- Clean up select option key warnings (`selected` attribute React error).
- Allow scheduling a reminder checkbox (creating an associated reminder row automatically).
- Support subject selection options.

---

### Environment & Deployment

#### [MODIFY] [.env.example](file:///c:/Users/SOBIT/Documents/reminder-app/productivity-app/.env.example)
- Add complete instructions and keys, including `NODE_OPTIONS` (for memory management) and details on the Resend/Google OAuth setups.

---

## Verification Plan

### Automated Tests
- Run `npm run build` and `npm run lint` to verify successful compilation with no TypeScript or styling warning errors.

### Manual Verification
- Launch local server with `npm run dev` and test:
  - Responsive layout transition to mobile (verifying sidebar routes toggle successfully).
  - Scheduling a task with an immediate reminder and verifying browser notifications and Sonner toast alerts trigger correctly.
  - Adding exam entries with Form Deadlines and verifying styling states.
