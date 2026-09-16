# Todo

A to-do app built with TanStack Start server functions and Neon Postgres.

**Live:** _not deployed yet — URL goes here_
**Planning notes:** [PLANNING.md](./PLANNING.md)

## Stack

| Concern          | Choice                                                      |
| ---------------- | ----------------------------------------------------------- |
| Framework        | TanStack Start (React 19, Vite)                             |
| Routing & state  | TanStack Router — URL search params are the source of truth |
| Data fetching    | TanStack Query with SSR hydration                           |
| Database         | Neon serverless Postgres                                    |
| ORM & migrations | Drizzle ORM + drizzle-kit                                   |
| Validation       | Zod, shared between server functions and URL params         |
| Styling          | Tailwind CSS                                                |

## Features

| #   | Requirement                 | Status                                                      |
| --- | --------------------------- | ----------------------------------------------------------- |
| 1   | Create to-dos               | Done — title, description, and status                       |
| 2   | List to-dos                 | Done — server-rendered, newest first by default             |
| 3   | Update to-dos               | Done — inline edit, or one-click status cycling             |
| 4   | Delete to-dos               | Done — soft delete with undo                                |
| 5   | Search to-dos               | Done — Postgres full-text search with partial-word fallback |
| 6   | Filter by status            | Done — to-do / in progress / done                           |
| 7   | Command palette & shortcuts | **Not implemented yet**                                     |

Beyond the brief: optimistic updates with rollback, undo on delete, shareable filter URLs,
debounced search, dark mode, and reversible migrations.

## Quick start

Requires Node 22+ (uses the built-in TypeScript loader and `process.loadEnvFile`).

```bash
npm install
cp .env.example .env     # add your Neon connection string
npm run db:migrate       # create the schema
npm run db:seed          # optional: 12 sample todos
npm run dev
```

### Environment

| Variable       | Required | Purpose                                  |
| -------------- | -------- | ---------------------------------------- |
| `DATABASE_URL` | yes      | Neon Postgres connection string (pooled) |
| `NODE_ENV`     | no       | Defaults to `development`                |

Environment variables are read and validated in exactly one place, [`src/config/env.ts`](./src/config/env.ts).
An ESLint rule fails the build if any other file touches `process.env`.

## Scripts

| Script                           | What it does                                         |
| -------------------------------- | ---------------------------------------------------- |
| `npm run dev`                    | Dev server                                           |
| `npm run build`                  | Production build                                     |
| `npm run lint` / `npm run check` | ESLint / Prettier check                              |
| `npm run db:generate`            | Generate a migration from schema changes             |
| `npm run db:migrate`             | Apply pending migrations                             |
| `npm run db:pop`                 | Roll back the last applied migration                 |
| `npm run db:push`                | Push schema directly, skipping migrations (dev only) |
| `npm run db:seed`                | Reset and seed sample data                           |
| `npm run db:check`               | Verify the database connection                       |
| `npm run db:studio`              | Drizzle Studio                                       |

## Architecture

```
src/
  config/env.ts        validated environment, the only reader of process.env
  db/schema.ts         drizzle table definition
  db/todos.ts          SQL queries, plain async functions
  server/todos.ts      server functions: validate input, delegate to db/todos.ts
  lib/validation.ts    zod schemas shared by server functions and URL params
  lib/mutations.ts     optimistic cache updates with rollback
  components/          UI
scripts/               migrate, pop, seed, connection check
drizzle/               generated migrations, plus hand-written down/ counterparts
```

**Server functions stay thin.** Each one validates with Zod and delegates to a plain async
function in `src/db/todos.ts`. Server functions need Vite's build transform, so they cannot be
called from Node; keeping the SQL in ordinary functions makes the data layer directly testable.

**The URL is the state.** `q`, `status`, and `sort` live in search params validated by Zod, so any
filtered view is shareable, bookmarkable, and works with the back button. Malformed params degrade
to defaults instead of erroring.

**Optimistic updates.** Mutations patch every cached filter combination immediately, snapshot the
previous state, roll back on failure, and invalidate on settle so the server reconciles ordering.

## Data model

One table. Notable columns:

- `status` — a Postgres enum, so an invalid value fails at the database, not just in TypeScript.
- `search_vector` — a generated `tsvector` with a GIN index; it cannot drift from the content.
- `deleted_at` — soft delete, which is what makes undo real rather than a UI illusion.
- `completed_at` — set by the server on entering `done`, preserved if a done todo is re-marked.

Search runs `websearch_to_tsquery` (handling quoted phrases and `-negation`) OR-ed with an escaped
`ILIKE` so partial words like `gro` still match `groceries`.

## Trade-offs

- **Dates render in UTC.** Relative timestamps would differ between server and client and break
  hydration. Localised times belong behind a mount check.
- **`db:pop` needs a hand-written down file** per migration, since Drizzle only generates forward
  SQL. It fails loudly with the expected path rather than half-rolling-back.
- **No auth.** The brief does not ask for it, and every todo is shared by every visitor.

## What I would add next

Authentication with per-user todos, drag-to-reorder, due dates, and a Playwright happy-path test
in CI.
