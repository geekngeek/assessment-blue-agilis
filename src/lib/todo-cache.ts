import type { QueryClient } from '@tanstack/react-query'
import type { Todo } from '#/server/todos.ts'
import type { TodoFilters } from '#/lib/validation.ts'

export type TodosSnapshot = Array<[Array<unknown>, Array<Todo> | undefined]>

// mirrors the server predicate well enough for an optimistic frame; invalidation reconciles the rest
export function matchesFilters(todo: Todo, filters: TodoFilters) {
  if (filters.status && todo.status !== filters.status) {
    return false
  }

  if (filters.q) {
    const needle = filters.q.toLowerCase()
    const haystack = `${todo.title} ${todo.description}`.toLowerCase()

    if (!haystack.includes(needle)) {
      return false
    }
  }

  return true
}

export function sortTodos(rows: Array<Todo>, filters: TodoFilters) {
  // a search is ranked by relevance on the server, so leave that order alone
  if (filters.q) {
    return rows
  }

  const sorted = [...rows]

  if (filters.sort === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title))
  } else if (filters.sort === 'oldest') {
    sorted.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  return sorted
}

// every cached filter combination is updated, not just the one on screen
export function updateTodoCaches(
  queryClient: QueryClient,
  updater: (rows: Array<Todo>, filters: TodoFilters) => Array<Todo>,
): TodosSnapshot {
  const entries = queryClient.getQueriesData<Array<Todo>>({
    queryKey: ['todos'],
  })

  for (const [key, rows] of entries) {
    if (!rows) {
      continue
    }

    const filters = key[1] as TodoFilters
    queryClient.setQueryData(key, updater(rows, filters))
  }

  return entries as TodosSnapshot
}

export function restoreTodoCaches(
  queryClient: QueryClient,
  snapshot: TodosSnapshot | undefined,
) {
  if (!snapshot) {
    return
  }

  for (const [key, rows] of snapshot) {
    queryClient.setQueryData(key, rows)
  }
}
