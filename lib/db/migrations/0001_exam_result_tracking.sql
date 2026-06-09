-- Migration: Add result tracking columns to exams table
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "appearedInExam" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultStatus" text DEFAULT 'not_appeared';
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultDate" timestamp;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultLink" text;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "score" text;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultNotes" text;
