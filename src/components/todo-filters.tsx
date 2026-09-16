import { getRouteApi, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Spinner } from '#/components/spinner.tsx'
import { useDebouncedValue } from '#/hooks/use-debounced-value.ts'
import { useDelayedFlag } from '#/hooks/use-delayed-flag.ts'

import {
  SEARCH_MAX_LENGTH,
  TODO_SORTS,
  TODO_STATUSES,
  TODO_STATUS_LABELS,
} from '#/lib/todo.ts'

import type { TodoSort, TodoStatus } from '#/lib/todo.ts'

const routeApi = getRouteApi('/')

const SEARCH_DEBOUNCE_MS = 250

const SPINNER_DELAY_MS = 120

const SORT_LABELS: Record<TodoSort, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title A–Z',
}

// id lets the command palette and the "/" shortcut focus this input in phase 5
export const SEARCH_INPUT_ID = 'todo-search'

export function TodoFilters() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const [query, setQuery] = useState(search.q ?? '')
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const isRouteLoading = useRouterState({ select: (state) => state.isLoading })

  // the debounce window counts as loading too, so the spinner covers the whole wait
  const isSettling = query.trim() !== (search.q ?? '')
  const showSpinner = useDelayedFlag(
    isSettling || isRouteLoading,
    SPINNER_DELAY_MS,
  )

  // resync when the url changes from somewhere else, such as a cleared filter
  useEffect(() => {
    setQuery(search.q ?? '')
  }, [search.q])

  // navigates only once typing settles, so keystrokes do not each push history or refetch
  useEffect(() => {
    const next = debouncedQuery.trim() || undefined

    if (next === search.q) {
      return
    }

    void navigate({
      search: (previous) => ({ ...previous, q: next }),
      replace: true,
    })
  }, [debouncedQuery, search.q, navigate])

  function selectStatus(status: TodoStatus | undefined) {
    void navigate({
      search: (previous) => ({ ...previous, status }),
      replace: true,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          id={SEARCH_INPUT_ID}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('')
            }
          }}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Search todos"
          aria-label="Search todos"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-16 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          {showSpinner ? (
            <Spinner />
          ) : (
            <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
              /
            </kbd>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900"
        >
          <FilterButton
            active={!search.status}
            onClick={() => selectStatus(undefined)}
          >
            All
          </FilterButton>
          {TODO_STATUSES.map((status) => (
            <FilterButton
              key={status}
              active={search.status === status}
              onClick={() => selectStatus(status)}
            >
              {TODO_STATUS_LABELS[status]}
            </FilterButton>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          Sort
          <select
            value={search.sort}
            onChange={(event) =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  sort: event.target.value as TodoSort,
                }),
                replace: true,
              })
            }
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
          >
            {TODO_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
      }`}
    >
      {children}
    </button>
  )
}
