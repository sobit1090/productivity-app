-- Migration: Money Management Module
-- Tables: money_accounts, money_transactions, cc_bills

CREATE TABLE IF NOT EXISTS "money_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "balance" numeric(12, 2) DEFAULT '0',
  "creditLimit" numeric(12, 2),
  "billingCycleDay" integer,
  "dueDateDay" integer,
  "dueDaysAfterBill" integer,
  "color" text DEFAULT '#6366f1',
  "icon" text DEFAULT 'credit-card',
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "money_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "accountId" integer NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "type" text NOT NULL DEFAULT 'debit',
  "category" text NOT NULL DEFAULT 'other',
  "merchant" text,
  "description" text,
  "notes" text,
  "transactionDate" timestamp NOT NULL DEFAULT now(),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "money_transactions_accountId_fkey" FOREIGN KEY ("accountId")
    REFERENCES "money_accounts"("id") ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cc_bills" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "accountId" integer NOT NULL,
  "billMonth" integer NOT NULL,
  "billYear" integer NOT NULL,
  "totalAmount" numeric(12, 2) NOT NULL DEFAULT '0',
  "dueDate" timestamp NOT NULL,
  "isPaid" boolean NOT NULL DEFAULT false,
  "paidDate" timestamp,
  "paidFromAccountId" integer,
  "paidAmount" numeric(12, 2),
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "cc_bills_accountId_fkey" FOREIGN KEY ("accountId")
    REFERENCES "money_accounts"("id") ON DELETE CASCADE
);
