import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { env } from '#/config/env.ts'

// HTTP driver against Neon's pooled endpoint; no connection pool to manage in serverless
const sql = neon(env.DATABASE_URL)

export const db = drizzle({ client: sql })

export type Database = typeof db
