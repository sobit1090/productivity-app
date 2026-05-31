# StudyFlow API Documentation

Complete API reference for StudyFlow server actions and endpoints.

## Authentication

All requests must include authentication via Better Auth sessions. Protected routes automatically redirect to `/sign-in` if not authenticated.

### Session Retrieval
```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user) throw new Error('Unauthorized')
```

## Server Actions

Server actions are called directly from client components and automatically handle authentication.

### Tasks

#### `getTasks()`
Get all tasks for authenticated user.

```typescript
import { getTasks } from '@/app/actions/tasks'

const tasks = await getTasks()
// Returns: Task[]
```

**Response:**
```typescript
{
  id: number
  userId: string
  subjectId?: number
  title: string
  description?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed'
  createdAt: Date
  updatedAt: Date
}[]
```

#### `createTask(data)`
Create a new task.

```typescript
import { createTask } from '@/app/actions/tasks'

const task = await createTask({
  title: 'Study Math',
  description: 'Chapter 5-8',
  dueDate: new Date('2026-06-15'),
  priority: 'high',
  subjectId: 1
})
// Returns: Task
```

**Parameters:**
- `title` (required): Task title
- `description` (optional): Task description
- `dueDate` (optional): Due date
- `priority` (optional): 'low' | 'medium' | 'high' (default: 'medium')
- `subjectId` (optional): Link to subject
- `status` (optional): 'pending' | 'completed' (default: 'pending')

#### `updateTask(id, data)`
Update an existing task.

```typescript
import { updateTask } from '@/app/actions/tasks'

const updated = await updateTask(1, {
  status: 'completed'
})
// Returns: Task
```

**Parameters:**
- `id` (required): Task ID
- `title` (optional): New title
- `description` (optional): New description
- `dueDate` (optional): New due date
- `priority` (optional): New priority
- `status` (optional): New status
- `subjectId` (optional): New subject link

#### `deleteTask(id)`
Delete a task.

```typescript
import { deleteTask } from '@/app/actions/tasks'

await deleteTask(1)
```

### Exams

#### `getExams()`
Get all exams for authenticated user.

```typescript
import { getExams } from '@/app/actions/exams'

const exams = await getExams()
// Returns: Exam[]
```

#### `createExam(data)`
Create a new exam.

```typescript
import { createExam } from '@/app/actions/exams'

const exam = await createExam({
  title: 'Math Final',
  examDate: new Date('2026-06-20T10:00:00'),
  duration: 120,
  location: 'Room 101',
  subjectId: 1
})
// Returns: Exam
```

**Parameters:**
- `title` (required): Exam title
- `examDate` (required): Exam date and time
- `duration` (optional): Duration in minutes
- `location` (optional): Exam location
- `syllabus` (optional): Syllabus info
- `subjectId` (optional): Link to subject
- `description` (optional): Exam description
- `status` (optional): 'scheduled' | 'completed' | 'cancelled'

#### `updateExam(id, data)`
Update an existing exam.

```typescript
import { updateExam } from '@/app/actions/exams'

const updated = await updateExam(1, {
  status: 'completed'
})
// Returns: Exam
```

#### `deleteExam(id)`
Delete an exam.

```typescript
import { deleteExam } from '@/app/actions/exams'

await deleteExam(1)
```

### Reminders

#### `getReminders()`
Get all reminders for authenticated user.

```typescript
import { getReminders } from '@/app/actions/reminders'

const reminders = await getReminders()
// Returns: Reminder[]
```

#### `createReminder(data)`
Create a new reminder with optional email notification.

```typescript
import { createReminder } from '@/app/actions/reminders'

const reminder = await createReminder({
  title: 'Study for Math',
  reminderDate: new Date('2026-06-15T18:00:00'),
  type: 'task',
  taskId: 5,
  sendEmail: true  // Send email reminder
})
// Returns: Reminder
```

**Parameters:**
- `title` (required): Reminder title
- `reminderDate` (required): When to remind
- `reminderTime` (optional): Time component as string
- `type` (optional): 'task' | 'exam'
- `taskId` (optional): Link to task
- `examId` (optional): Link to exam
- `sendEmail` (optional): Send email immediately (boolean)

**Email Reminder:**
When `sendEmail: true`, sends an HTML email to the user with reminder details and a link to the dashboard.

#### `updateReminder(id, data)`
Update a reminder.

```typescript
import { updateReminder } from '@/app/actions/reminders'

const updated = await updateReminder(1, {
  isNotified: true
})
// Returns: Reminder
```

#### `deleteReminder(id)`
Delete a reminder.

```typescript
import { deleteReminder } from '@/app/actions/reminders'

await deleteReminder(1)
```

### Study Sessions

#### `getStudySessions()`
Get all study sessions for authenticated user.

```typescript
import { getStudySessions } from '@/app/actions/study-sessions'

const sessions = await getStudySessions()
// Returns: StudySession[]
```

#### `createStudySession(data)`
Create a new study session.

```typescript
import { createStudySession } from '@/app/actions/study-sessions'

const session = await createStudySession({
  title: 'Math Chapter 5',
  subjectId: 1,
  startTime: new Date('2026-06-10T15:00:00'),
  endTime: new Date('2026-06-10T16:30:00'),
  notes: 'Covered derivatives'
})
// Returns: StudySession
```

**Parameters:**
- `title` (required): Session title
- `subjectId` (optional): Link to subject
- `startTime` (required): Session start time
- `endTime` (optional): Session end time
- `duration` (optional): Duration in minutes (calculated if endTime provided)
- `notes` (optional): Session notes

#### `deleteStudySession(id)`
Delete a study session.

```typescript
import { deleteStudySession } from '@/app/actions/study-sessions'

await deleteStudySession(1)
```

### Notes

#### `getNotes()`
Get all notes for authenticated user.

```typescript
import { getNotes } from '@/app/actions/notes'

const notes = await getNotes()
// Returns: Note[]
```

#### `createNote(data)`
Create a new note.

```typescript
import { createNote } from '@/app/actions/notes'

const note = await createNote({
  title: 'Photosynthesis',
  content: 'Process of converting light to chemical energy...',
  subjectId: 2
})
// Returns: Note
```

**Parameters:**
- `title` (required): Note title
- `content` (optional): Note content
- `imageUrl` (optional): URL to attached image
- `subjectId` (optional): Link to subject
- `tags` (optional): Array of tag strings

#### `deleteNote(id)`
Delete a note.

```typescript
import { deleteNote } from '@/app/actions/notes'

await deleteNote(1)
```

### Subjects

#### `getSubjects()`
Get all subjects for authenticated user.

```typescript
import { getSubjects } from '@/app/actions/subjects'

const subjects = await getSubjects()
// Returns: Subject[]
```

#### `createSubject(data)`
Create a new subject.

```typescript
import { createSubject } from '@/app/actions/subjects'

const subject = await createSubject({
  name: 'Mathematics',
  color: '#3b82f6'
})
// Returns: Subject
```

**Parameters:**
- `name` (required): Subject name
- `color` (optional): Hex color code

#### `deleteSubject(id)`
Delete a subject.

```typescript
import { deleteSubject } from '@/app/actions/subjects'

await deleteSubject(1)
```

### Analytics

#### `getAnalytics()`
Get analytics data for authenticated user.

```typescript
import { getAnalytics } from '@/app/actions/analytics'

const analytics = await getAnalytics()
// Returns: Analytics object
```

**Response:**
```typescript
{
  totalTasks: number
  completedTasks: number
  completionRate: number (0-100)
  recentLogs: ProductivityLog[]
}
```

#### `getStudySessionStats()`
Get study session statistics.

```typescript
import { getStudySessionStats } from '@/app/actions/analytics'

const stats = await getStudySessionStats()
// Returns: StudySessionStats
```

**Response:**
```typescript
{
  totalSessions: number
  totalHours: number
  averageSessionLength: number
}
```

## API Routes

### Cron Endpoints

#### `GET /api/cron/send-reminders`
Automatically send email reminders that are due. Called by Vercel Cron Jobs.

**Authentication:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "sentCount": 3,
  "totalReminders": 5,
  "errors": ["Reminder 2: Email delivery failed"]
}
```

**Schedule:**
- Default: Every hour (`0 * * * *`)
- Configure in `vercel.json` under `crons`

**Required Environment Variable:**
- `CRON_SECRET`: Bearer token for authorization

### Auth Endpoints

#### `POST /api/auth/sign-up`
Sign up with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

#### `POST /api/auth/sign-in`
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### `POST /api/auth/sign-out`
Sign out and clear session.

#### `GET /api/auth/google`
Google OAuth sign-in/sign-up flow.

Redirects to Google, then back to `/api/auth/callback/google`

## Database Schema

### Core Tables

**users** (Better Auth)
- id: UUID
- email: string (unique)
- name: string
- emailVerified: boolean
- image: string (optional)
- createdAt: timestamp
- updatedAt: timestamp

**tasks**
- id: integer (primary key)
- userId: UUID (foreign key)
- subjectId: integer (foreign key, optional)
- title: string
- description: string (optional)
- dueDate: timestamp (optional)
- priority: enum ('low', 'medium', 'high')
- status: enum ('pending', 'completed')
- createdAt: timestamp
- updatedAt: timestamp

**exams**
- id: integer (primary key)
- userId: UUID (foreign key)
- subjectId: integer (foreign key, optional)
- title: string
- description: string (optional)
- examDate: timestamp
- duration: integer (optional, in minutes)
- location: string (optional)
- syllabus: string (optional)
- status: enum ('scheduled', 'completed', 'cancelled')
- createdAt: timestamp
- updatedAt: timestamp

**reminders**
- id: integer (primary key)
- userId: UUID (foreign key)
- taskId: integer (foreign key, optional)
- examId: integer (foreign key, optional)
- title: string
- reminderDate: timestamp
- reminderTime: string (optional)
- type: string (optional)
- isNotified: boolean (default: false)
- createdAt: timestamp
- updatedAt: timestamp

**study_sessions**
- id: integer (primary key)
- userId: UUID (foreign key)
- subjectId: integer (foreign key, optional)
- title: string
- startTime: timestamp
- endTime: timestamp (optional)
- duration: integer (optional, in minutes)
- notes: string (optional)
- createdAt: timestamp
- updatedAt: timestamp

**subjects**
- id: integer (primary key)
- userId: UUID (foreign key)
- name: string
- color: string (optional)
- createdAt: timestamp
- updatedAt: timestamp

**notes**
- id: integer (primary key)
- userId: UUID (foreign key)
- subjectId: integer (foreign key, optional)
- title: string
- content: string (optional)
- imageUrl: string (optional)
- createdAt: timestamp
- updatedAt: timestamp

**productivity_logs**
- id: integer (primary key)
- userId: UUID (foreign key)
- date: date
- tasksCompleted: integer (optional)
- studyHours: decimal (optional)
- mood: string (optional)
- notes: string (optional)
- createdAt: timestamp
- updatedAt: timestamp

## Error Handling

All server actions throw errors on failure:

```typescript
try {
  const task = await createTask({ title: '' }) // Invalid: empty title
} catch (error) {
  console.error(error.message)
  // Error: Task title is required
}
```

Common errors:
- `Unauthorized` - Not logged in
- `Task not found` - Invalid task ID
- `User ID mismatch` - Attempting to access another user's data
- `Database error` - Connection or query issue

## Rate Limiting

No built-in rate limiting on server actions. Consider adding:
- IP-based rate limiting on cron endpoint
- Database-based rate limiting for high-frequency operations
- Vercel rate limiting middleware

## Best Practices

1. **Always check authentication**
   ```typescript
   const userId = await getUserId() // Throws if not authenticated
   ```

2. **Use prepared statements** (built into Drizzle)
   ```typescript
   // ✅ Safe
   db.select().from(tasks).where(eq(tasks.id, taskId))
   
   // ❌ Unsafe (don't do this)
   db.query(`SELECT * FROM tasks WHERE id = ${taskId}`)
   ```

3. **Scope queries by userId**
   ```typescript
   // ✅ Correct
   where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
   
   // ❌ Wrong - could access other users' data
   where(eq(tasks.id, taskId))
   ```

4. **Revalidate cache after mutations**
   ```typescript
   import { revalidatePath } from 'next/cache'
   revalidatePath('/') // Revalidate dashboard
   ```

5. **Handle errors gracefully**
   ```typescript
   try {
     await sendReminderEmail(...)
   } catch (error) {
     // Log error but don't fail the operation
     console.error('Email failed:', error)
   }
   ```

## Examples

### Create Task and Set Reminder

```typescript
import { createTask } from '@/app/actions/tasks'
import { createReminder } from '@/app/actions/reminders'

const task = await createTask({
  title: 'Biology Report',
  dueDate: new Date('2026-06-15'),
  priority: 'high'
})

await createReminder({
  title: 'Remember: Biology Report Due',
  reminderDate: new Date('2026-06-15T09:00:00'),
  taskId: task.id,
  sendEmail: true // Send email reminder
})
```

### Get User Analytics

```typescript
import { getAnalytics, getStudySessionStats } from '@/app/actions/analytics'

const analytics = await getAnalytics()
const stats = await getStudySessionStats()

console.log(`Completion Rate: ${analytics.completionRate}%`)
console.log(`Study Hours: ${stats.totalHours}`)
```

### Track Study Session

```typescript
import { createStudySession } from '@/app/actions/study-sessions'

const start = new Date()
const end = new Date(start.getTime() + 90 * 60000) // 90 minutes

await createStudySession({
  title: 'Calculus Problem Sets',
  subjectId: 1,
  startTime: start,
  endTime: end,
  notes: 'Completed chapters 1-3'
})
```

---

For more information, see:
- PRODUCTION_SETUP.md - Environment and deployment
- QUICKSTART.md - Getting started
- Database schema in lib/db/schema.ts
