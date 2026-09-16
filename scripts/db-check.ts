import { sql } from 'drizzle-orm'

import { db } from '../src/db/client.ts'

// boot-time connectivity probe; run with `npm run db:check`
async function main() {
  const rows = await db.execute(
    sql`select current_database() as database, version() as version`,
  )
  const row = rows.rows.at(0)

  console.log('connected to:', row?.database)
  console.log('server:', String(row?.version).split(',').at(0))
}

main().catch((error: unknown) => {
  console.error('database check failed:', error)
  process.exitCode = 1
})
