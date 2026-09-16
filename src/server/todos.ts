import { createServerFn } from '@tanstack/react-start'

import {
  insertTodo,
  restoreTodoById,
  selectTodos,
  softDeleteTodoById,
  updateTodoById,
} from '#/db/todos.ts'
import {
  createTodoSchema,
  todoFiltersSchema,
  todoIdInputSchema,
  updateTodoSchema,
} from '#/lib/validation.ts'

export type { Todo } from '#/db/todos.ts'

// each function validates its input, then delegates; the SQL lives in src/db/todos.ts
export const listTodos = createServerFn({ method: 'GET' })
  .validator(todoFiltersSchema)
  .handler(({ data }) => selectTodos(data))

export const createTodo = createServerFn({ method: 'POST' })
  .validator(createTodoSchema)
  .handler(({ data }) => insertTodo(data))

export const updateTodo = createServerFn({ method: 'POST' })
  .validator(updateTodoSchema)
  .handler(({ data }) => updateTodoById(data))

export const deleteTodo = createServerFn({ method: 'POST' })
  .validator(todoIdInputSchema)
  .handler(({ data }) => softDeleteTodoById(data.id))

export const restoreTodo = createServerFn({ method: 'POST' })
  .validator(todoIdInputSchema)
  .handler(({ data }) => restoreTodoById(data.id))
