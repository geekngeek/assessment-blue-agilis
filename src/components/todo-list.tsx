import { getRouteApi, useRouterState } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Spinner } from '#/components/spinner.tsx'
import { TodoItem } from '#/components/todo-item.tsx'
import { useDelayedFlag } from '#/hooks/use-delayed-flag.ts'
import { pluralize } from '#/lib/format.ts'
import { todosQueryOptions } from '#/lib/queries.ts'
import { TODO_STATUS_LABELS } from '#/lib/todo.ts'

const routeApi = getRouteApi('/')

export function TodoList() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { data: todos } = useSuspenseQuery(todosQueryOptions(search))
  const isRouteLoading = useRouterState({ select: (state) => state.isLoading })

  // previous results stay on screen while the next set loads, just visibly de-emphasised
  const isRefreshing = useDelayedFlag(isRouteLoading, 120)

  const isFiltered = Boolean(search.q) || Boolean(search.status)

  function clearFilters() {
    void navigate({
      search: (previous) => ({ sort: previous.sort }),
      replace: true,
    })
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-2">
          <span aria-live="polite">{pluralize(todos.length, 'todo')}</span>
          {isRefreshing ? <Spinner className="size-3" /> : null}
        </span>
        {isFiltered ? (
          <button
            type="button"
            onClick={clearFilters}
            className="font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {todos.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered}
          query={search.q}
          status={search.status}
          onClear={clearFilters}
        />
      ) : (
        <ul
          className={`overflow-hidden rounded-xl border border-neutral-200 bg-white transition-opacity dark:border-neutral-800 dark:bg-neutral-900 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
        >
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </section>
  )
}

// an empty database and an over-filtered search are different problems, so they read differently
function EmptyState({
  isFiltered,
  query,
  status,
  onClear,
}: {
  isFiltered: boolean
  query: string | undefined
  status: keyof typeof TODO_STATUS_LABELS | undefined
  onClear: () => void
}) {
  if (!isFiltered) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700">
        <p className="font-medium">No todos yet</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Create your first one to get started.
        </p>
      </div>
    )
  }

  const describedAs = query
    ? `matching “${query}”`
    : `with status “${status ? TODO_STATUS_LABELS[status] : ''}”`

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700">
      <p className="font-medium">No todos {describedAs}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm text-neutral-500 underline underline-offset-2 dark:text-neutral-400"
      >
        Clear filters
      </button>
    </div>
  )
}
