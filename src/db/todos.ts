import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm'

import { db } from '#/db/client.ts'
import { todos } from '#/db/schema.ts'
import { TodoNotFoundError } from '#/lib/errors.ts'

import type { SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'
import type {
  CreateTodoInput,
  TodoFilters,
  UpdateTodoInput,
} from '#/lib/validation.ts'

// every column except search_vector; the tsvector is a server-side index, not client data
const todoColumns = {
  id: todos.id,
  title: todos.title,
  description: todos.description,
  status: todos.status,
  createdAt: todos.createdAt,
  updatedAt: todos.updatedAt,
  completedAt: todos.completedAt,
  deletedAt: todos.deletedAt,
}

export type Todo = {
  [Key in keyof typeof todoColumns]: (typeof todos.$inferSelect)[Key]
}

// user input reaches ILIKE, so its wildcards must not be treated as pattern syntax
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export async function selectTodos(filters: TodoFilters): Promise<Array<Todo>> {
  const { q, status, sort } = filters

  const conditions: Array<SQL> = [isNull(todos.deletedAt)]

  if (status) {
    conditions.push(eq(todos.status, status))
  }

  const tsQuery = q ? sql`websearch_to_tsquery('english', ${q})` : null

  if (q && tsQuery) {
    // full text handles words and phrases, ILIKE covers partial words like "gro" -> "groceries"
    conditions.push(
      or(
        sql`${todos.searchVector} @@ ${tsQuery}`,
        ilike(todos.title, `%${escapeLike(q)}%`),
      ) as SQL,
    )
  }

  const orderBy = tsQuery
    ? [
        desc(sql`ts_rank(${todos.searchVector}, ${tsQuery})`),
        desc(todos.createdAt),
      ]
    : sort === 'oldest'
      ? [asc(todos.createdAt)]
      : sort === 'title'
        ? [asc(todos.title)]
        : [desc(todos.createdAt)]

  return db
    .select(todoColumns)
    .from(todos)
    .where(and(...conditions))
    .orderBy(...orderBy)
}

export async function insertTodo(input: CreateTodoInput): Promise<Todo> {
  const [created] = await db
    .insert(todos)
    .values({
      title: input.title,
      description: input.description,
      status: input.status,
      completedAt: input.status === 'done' ? new Date() : null,
    })
    .returning(todoColumns)

  return created
}

export async function updateTodoById(input: UpdateTodoInput): Promise<Todo> {
  const patch: PgUpdateSetSource<typeof todos> = { updatedAt: new Date() }

  if (input.title !== undefined) {
    patch.title = input.title
  }

  if (input.description !== undefined) {
    patch.description = input.description
  }

  if (input.status !== undefined) {
    patch.status = input.status
    // re-marking an already-done todo keeps its original completion time
    patch.completedAt =
      input.status === 'done'
        ? sql`case when ${todos.status} = 'done' then ${todos.completedAt} else now() end`
        : null
  }

  const updated = (
    await db
      .update(todos)
      .set(patch)
      .where(and(eq(todos.id, input.id), isNull(todos.deletedAt)))
      .returning(todoColumns)
  ).at(0)

  if (!updated) {
    throw new TodoNotFoundError(input.id)
  }

  return updated
}

export async function softDeleteTodoById(id: string): Promise<Todo> {
  const now = new Date()

  // soft delete, so the undo action has something to restore
  const deleted = (
    await db
      .update(todos)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(todos.id, id), isNull(todos.deletedAt)))
      .returning(todoColumns)
  ).at(0)

  if (!deleted) {
    throw new TodoNotFoundError(id)
  }

  return deleted
}

export async function restoreTodoById(id: string): Promise<Todo> {
  const restored = (
    await db
      .update(todos)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(todos.id, id), isNotNull(todos.deletedAt)))
      .returning(todoColumns)
  ).at(0)

  if (!restored) {
    throw new TodoNotFoundError(id)
  }

  return restored
}
