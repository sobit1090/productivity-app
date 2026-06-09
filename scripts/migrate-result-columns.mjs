// Run with: node scripts/migrate-result-columns.mjs
// Adds 6 result-tracking columns to the exams table using IF NOT EXISTS (safe to re-run).

import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load .env manually
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  console.error('❌  DATABASE_URL not set in .env')
  process.exit(1)
}

// Fix common typo "ostgresql" -> "postgresql"
const url = rawUrl.startsWith('ostgresql') ? 'p' + rawUrl : rawUrl

const { Pool } = require('pg')
const pool = new Pool({ connectionString: url })

const statements = [
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "appearedInExam" boolean DEFAULT false`,
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultStatus" text DEFAULT 'not_appeared'`,
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultDate" timestamp`,
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultLink" text`,
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "score" text`,
  `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "resultNotes" text`,
]

console.log('🚀  Running result-tracking migration…\n')

const client = await pool.connect()
try {
  for (const stmt of statements) {
    await client.query(stmt)
    const col = stmt.match(/"([a-zA-Z]+)"\s+(boolean|text|timestamp)/)?.[1] ?? '?'
    console.log(`  ✅  Added column: ${col}`)
  }
  console.log('\n✨  Migration complete! All result-tracking columns are ready.')
} catch (err) {
  console.error('\n❌  Migration failed:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
