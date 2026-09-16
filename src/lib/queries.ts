import { queryOptions } from '@tanstack/react-query'

import { listTodos } from '#/server/todos.ts'

import type { TodoFilters } from '#/lib/validation.ts'

// the filters are the cache key, so every distinct url gets its own cache entry
export function todosQueryOptions(filters: TodoFilters) {
  return queryOptions({
    queryKey: ['todos', filters] as const,
    queryFn: () => listTodos({ data: filters }),
  })
}
