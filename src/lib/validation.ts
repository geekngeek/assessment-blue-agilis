import { z } from 'zod'

import {
  DESCRIPTION_MAX_LENGTH,
  SEARCH_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TODO_SORTS,
  TODO_STATUSES,
} from '#/lib/todo.ts'

export const todoIdSchema = z.uuid('Expected a todo id')

export const todoStatusSchema = z.enum(TODO_STATUSES)

export const todoSortSchema = z.enum(TODO_SORTS)

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(TITLE_MAX_LENGTH),
  description: z.string().trim().max(DESCRIPTION_MAX_LENGTH).default(''),
  status: todoStatusSchema.default('todo'),
})

export const updateTodoSchema = z
  .object({
    id: todoIdSchema,
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(TITLE_MAX_LENGTH)
      .optional(),
    description: z.string().trim().max(DESCRIPTION_MAX_LENGTH).optional(),
    status: todoStatusSchema.optional(),
  })
  .refine(
    (patch) =>
      patch.title !== undefined ||
      patch.description !== undefined ||
      patch.status !== undefined,
    { message: 'Provide at least one field to update' },
  )

export const todoIdInputSchema = z.object({ id: todoIdSchema })

// doubles as the route search param schema so a filtered view is shareable by URL
export const todoFiltersSchema = z.object({
  q: z.string().trim().max(SEARCH_MAX_LENGTH).optional(),
  status: todoStatusSchema.optional(),
  sort: todoSortSchema.default('newest'),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
export type TodoFilters = z.infer<typeof todoFiltersSchema>
