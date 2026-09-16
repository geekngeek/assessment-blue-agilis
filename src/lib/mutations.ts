import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useToast } from '#/components/toast.tsx'

import {
  matchesFilters,
  restoreTodoCaches,
  sortTodos,
  updateTodoCaches,
} from '#/lib/todo-cache.ts'
import { forgetDeleted, rememberDeleted } from '#/lib/undo.ts'
import {
  createTodo,
  deleteTodo,
  restoreTodo,
  updateTodo,
} from '#/server/todos.ts'

import type { TodosSnapshot } from '#/lib/todo-cache.ts'
import type { CreateTodoInput, UpdateTodoInput } from '#/lib/validation.ts'
import type { Todo } from '#/server/todos.ts'

const TODOS_KEY = ['todos'] as const

export const OPTIMISTIC_ID_PREFIX = 'optimistic-'

export function isOptimistic(todo: Todo) {
  return todo.id.startsWith(OPTIMISTIC_ID_PREFIX)
}

function buildOptimisticTodo(input: CreateTodoInput): Todo {
  const now = new Date()

  return {
    id: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
    title: input.title,
    description: input.description,
    status: input.status,
    createdAt: now,
    updatedAt: now,
    completedAt: input.status === 'done' ? now : null,
    deletedAt: null,
  }
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY })

      const optimistic = buildOptimisticTodo(input)

      const snapshot = updateTodoCaches(queryClient, (rows, filters) =>
        matchesFilters(optimistic, filters)
          ? sortTodos([optimistic, ...rows], filters)
          : rows,
      )

      return { snapshot }
    },
    onError: (_error, _input, context) => {
      restoreTodoCaches(queryClient, context?.snapshot)
      showToast({ message: 'Could not create todo', tone: 'error' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (input: UpdateTodoInput) => updateTodo({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY })

      const snapshot = updateTodoCaches(queryClient, (rows, filters) => {
        const next = rows.map((row) =>
          row.id === input.id
            ? {
                ...row,
                ...(input.title === undefined ? {} : { title: input.title }),
                ...(input.description === undefined
                  ? {}
                  : { description: input.description }),
                ...(input.status === undefined ? {} : { status: input.status }),
                updatedAt: new Date(),
              }
            : row,
        )

        // an edit can push a row out of the active filter, so drop it instead of showing a stale match
        return sortTodos(
          next.filter(
            (row) => row.id !== input.id || matchesFilters(row, filters),
          ),
          filters,
        )
      })

      return { snapshot }
    },
    onError: (_error, _input, context) => {
      restoreTodoCaches(queryClient, context?.snapshot)
      showToast({ message: 'Could not save changes', tone: 'error' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteTodo({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY })

      const snapshot: TodosSnapshot = updateTodoCaches(queryClient, (rows) =>
        rows.filter((row) => row.id !== id),
      )

      rememberDeleted(id)

      return { snapshot }
    },
    onError: (_error, id, context) => {
      forgetDeleted(id)
      restoreTodoCaches(queryClient, context?.snapshot)
      showToast({ message: 'Could not delete todo', tone: 'error' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

export function useRestoreTodo() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => restoreTodo({ data: { id } }),
    onError: () =>
      showToast({ message: 'Could not undo that delete', tone: 'error' }),
    // the row's position depends on server state, so let the refetch place it
    onSettled: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}
