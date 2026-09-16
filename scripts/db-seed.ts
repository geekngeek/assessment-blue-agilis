import { sql } from 'drizzle-orm'

import { db } from '../src/db/client.ts'
import { todos } from '../src/db/schema.ts'

import type { NewTodo } from '../src/db/schema.ts'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// spread created_at over the last few days so the default newest-first ordering looks real
function ago(offset: number) {
  return new Date(Date.now() - offset)
}

const SEED: Array<NewTodo> = [
  {
    title: 'Draft the Q3 roadmap',
    description:
      'Pull themes from the customer interviews and share with the leadership channel.',
    status: 'in_progress',
    createdAt: ago(2 * HOUR),
    updatedAt: ago(30 * MINUTE),
  },
  {
    title: 'Buy groceries',
    description: 'Milk, eggs, coffee beans, and something green.',
    status: 'todo',
    createdAt: ago(5 * HOUR),
    updatedAt: ago(5 * HOUR),
  },
  {
    title: 'Fix flaky checkout test',
    description: 'The payment step times out on CI about one run in five.',
    status: 'in_progress',
    createdAt: ago(9 * HOUR),
    updatedAt: ago(1 * HOUR),
  },
  {
    title: 'Review pull request #482',
    description:
      'Search indexing changes; check the migration is reversible before approving.',
    status: 'todo',
    createdAt: ago(1 * DAY),
    updatedAt: ago(1 * DAY),
  },
  {
    title: 'Renew domain registration',
    description:
      'Expires at the end of the month; move it to the team billing account.',
    status: 'todo',
    createdAt: ago(1 * DAY + 3 * HOUR),
    updatedAt: ago(1 * DAY + 3 * HOUR),
  },
  {
    title: 'Write onboarding docs for the API',
    description:
      'Cover auth, rate limits, and a working curl example for each endpoint.',
    status: 'in_progress',
    createdAt: ago(2 * DAY),
    updatedAt: ago(4 * HOUR),
  },
  {
    title: 'Book dentist appointment',
    description: 'Six month cleaning, ideally a morning slot.',
    status: 'todo',
    createdAt: ago(2 * DAY + 6 * HOUR),
    updatedAt: ago(2 * DAY + 6 * HOUR),
  },
  {
    title: 'Upgrade the staging database',
    description: 'Postgres 17 to 18, take a branch snapshot first.',
    status: 'done',
    createdAt: ago(3 * DAY),
    updatedAt: ago(2 * DAY),
    completedAt: ago(2 * DAY),
  },
  {
    title: 'Cancel the unused analytics plan',
    description: 'Nobody has opened the dashboard since the migration.',
    status: 'done',
    createdAt: ago(4 * DAY),
    updatedAt: ago(3 * DAY + 2 * HOUR),
    completedAt: ago(3 * DAY + 2 * HOUR),
  },
  {
    title: 'Set up error monitoring',
    description:
      'Wire alerts into the on-call channel and mute the noisy health check.',
    status: 'done',
    createdAt: ago(5 * DAY),
    updatedAt: ago(4 * DAY),
    completedAt: ago(4 * DAY),
  },
  {
    title: 'Plan the team offsite',
    description: 'Two days in October, somewhere reachable by train.',
    status: 'todo',
    createdAt: ago(6 * DAY),
    updatedAt: ago(6 * DAY),
  },
  {
    title: 'Refactor the notification queue',
    description:
      'Retries are duplicating emails when the worker restarts mid-batch.',
    status: 'in_progress',
    createdAt: ago(7 * DAY),
    updatedAt: ago(8 * HOUR),
  },
  {
    title: 'Old idea that was thrown away',
    description:
      'Kept only so the soft delete filter has something to exclude.',
    status: 'todo',
    createdAt: ago(8 * DAY),
    updatedAt: ago(8 * DAY),
    deletedAt: ago(7 * DAY),
  },
]

async function main() {
  const existing = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from todos`,
  )
  const removed = existing.rows.at(0)?.count ?? 0

  // seeding is a reset, not an append, so repeated runs stay deterministic
  await db.delete(todos)

  const inserted = await db
    .insert(todos)
    .values(SEED)
    .returning({ status: todos.status })

  const counts = inserted.reduce<Record<string, number>>((totals, row) => {
    totals[row.status] = (totals[row.status] ?? 0) + 1
    return totals
  }, {})

  console.log(`removed ${removed} existing todo(s)`)
  console.log(`inserted ${inserted.length} todo(s):`, counts)
  console.log('1 of them is soft deleted and should not appear in any list')
}

main().catch((error: unknown) => {
  console.error('seed failed:', error)
  process.exitCode = 1
})
