import { pgTable, text, timestamp, boolean, serial, integer, decimal, date } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  subjectId: integer('subjectId'),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('dueDate'),
  priority: text('priority').default('medium'),
  status: text('status').default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  subjectId: integer('subjectId'),
  title: text('title').notNull(),
  description: text('description'),
  examDate: timestamp('examDate').notNull(),
  duration: integer('duration'),
  location: text('location'),
  syllabus: text('syllabus'),
  formDeadline: timestamp('formDeadline'),
  admitCardLink: text('admitCardLink'),
  admitCardStatus: text('admitCardStatus').default('pending'),
  status: text('status').default('scheduled'),
  // Result tracking
  appearedInExam: boolean('appearedInExam').default(false),
  resultStatus: text('resultStatus').default('not_appeared'), // not_appeared | awaited | declared
  resultDate: timestamp('resultDate'),          // expected / actual result date
  resultLink: text('resultLink'),              // official result URL
  score: text('score'),                        // marks / rank / grade
  resultNotes: text('resultNotes'),            // any personal notes about result
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  taskId: integer('taskId'),
  examId: integer('examId'),
  title: text('title').notNull(),
  reminderDate: timestamp('reminderDate').notNull(),
  reminderTime: text('reminderTime'),
  type: text('type'),
  isNotified: boolean('isNotified').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  subjectId: integer('subjectId'),
  title: text('title').notNull(),
  startTime: timestamp('startTime').notNull(),
  endTime: timestamp('endTime'),
  duration: integer('duration'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const productivityLogs = pgTable('productivity_logs', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  date: date('date').notNull(),
  tasksCompleted: integer('tasksCompleted').default(0),
  studyHours: decimal('studyHours'),
  mood: text('mood'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  subjectId: integer('subjectId'),
  title: text('title').notNull(),
  content: text('content'),
  imageUrl: text('imageUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
