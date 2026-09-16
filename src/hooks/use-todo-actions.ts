import { useCallback } from 'react'

import { useToast } from '#/components/toast.tsx'
import {
  useCreateTodo,
  useDeleteTodo,
  useRestoreTodo,
  useUpdateTodo,
} from '#/lib/mutations.ts'
import { forgetDeleted, takeLastDeleted } from '#/lib/undo.ts'

import type { CreateTodoInput, UpdateTodoInput } from '#/lib/validation.ts'
import type { Todo } from '#/server/todos.ts'

// one place for the delete-then-undo flow, so the list and the command palette behave identically
export function useTodoActions() {
  const { showToast } = useToast()
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()
  const restoreMutation = useRestoreTodo()

  const restore = useCallback(
    (id: string) => {
      forgetDeleted(id)
      restoreMutation.mutate(id)
    },
    [restoreMutation],
  )

  const create = useCallback(
    (input: CreateTodoInput) => createMutation.mutate(input),
    [createMutation],
  )

  const update = useCallback(
    (input: UpdateTodoInput) => updateMutation.mutate(input),
    [updateMutation],
  )

  const remove = useCallback(
    (todo: Todo) => {
      deleteMutation.mutate(todo.id)

      // shown now rather than in a mutate() callback, which never fires once the row unmounts
      showToast({
        message: `Deleted “${todo.title}”`,
        action: { label: 'Undo', onAction: () => restore(todo.id) },
      })
    },
    [deleteMutation, restore, showToast],
  )

  const undoLastDelete = useCallback(() => {
    const id = takeLastDeleted()

    if (!id) {
      showToast({ message: 'Nothing to undo' })
      return
    }

    restore(id)
  }, [restore, showToast])

  return { create, update, remove, restore, undoLastDelete }
}
