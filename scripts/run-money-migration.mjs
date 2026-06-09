// Run with: node scripts/run-money-migration.mjs
// Applies the 0002_money_management.sql migrations safely

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

const sqlPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', '0002_money_management.sql')
if (!fs.existsSync(sqlPath)) {
  console.error(`❌  SQL file not found at ${sqlPath}`)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf-8')
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)

console.log('🚀  Running money management migration…\n')

const client = await pool.connect()
try {
  for (const stmt of statements) {
    console.log(`Executing statement starting with: ${stmt.slice(0, 50)}...`)
    await client.query(stmt)
  }
  console.log('\n✨  Migration complete! Money management tables are ready.')
} catch (err) {
  console.error('\n❌  Migration failed:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
