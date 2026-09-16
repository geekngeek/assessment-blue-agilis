import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'

import { db } from '#/db/client'

// smoke-test server function; proves the RPC boundary and the database connection are both live
export const getHello = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await db.execute(sql`select current_database() as database`)

  return {
    message: 'Hello from the server',
    runtime: `Node ${process.version}`,
    database: String(result.rows.at(0)?.database ?? 'unknown'),
    at: new Date().toISOString(),
  }
})
