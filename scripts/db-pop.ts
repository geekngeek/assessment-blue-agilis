import { readFile } from 'node:fs/promises'
import { sql } from 'drizzle-orm'

import { db } from '../src/db/client.ts'

interface JournalEntry {
  idx: number
  when: number
  tag: string
}

// drizzle only generates forward SQL, so each migration needs a hand-written partner here
const DOWN_DIR = './drizzle/down'

async function readJournal(): Promise<Array<JournalEntry>> {
  const raw = await readFile('./drizzle/meta/_journal.json', 'utf8')
  return (JSON.parse(raw) as { entries: Array<JournalEntry> }).entries
}

async function findLastApplied() {
  const result = await db.execute<{ id: number; created_at: string }>(
    sql`select id, created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
  )
  return result.rows.at(0)
}

async function main() {
  const applied = await findLastApplied()

  if (!applied) {
    console.log('nothing to roll back; no migrations are applied')
    return
  }

  const entries = await readJournal()
  const entry = entries.find((item) => item.when === Number(applied.created_at))

  if (!entry) {
    throw new Error(
      `applied migration at ${applied.created_at} has no journal entry; ./drizzle and the database are out of sync`,
    )
  }

  const downPath = `${DOWN_DIR}/${entry.tag}.sql`
  let downSql: string

  try {
    downSql = await readFile(downPath, 'utf8')
  } catch {
    throw new Error(
      `no down migration at ${downPath}; write one before rolling back ${entry.tag}`,
    )
  }

  const statements = downSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

  console.log(`rolling back ${entry.tag} (${statements.length} statements)`)

  // the neon http driver has no interactive transactions, so statements run one at a time
  for (const statement of statements) {
    await db.execute(sql.raw(statement))
  }

  await db.execute(
    sql`delete from drizzle.__drizzle_migrations where id = ${applied.id}`,
  )

  console.log(`rolled back ${entry.tag}`)
}

main().catch((error: unknown) => {
  console.error('pop failed:', error)
  process.exitCode = 1
})
