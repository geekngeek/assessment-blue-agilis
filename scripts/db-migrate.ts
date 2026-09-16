import { migrate } from 'drizzle-orm/neon-http/migrator'

import { db } from '../src/db/client.ts'

// applies every pending migration in ./drizzle, tracked in drizzle.__drizzle_migrations
async function main() {
  console.log('applying pending migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('migrations up to date')
}

main().catch((error: unknown) => {
  console.error('migrate failed:', error)
  process.exitCode = 1
})
