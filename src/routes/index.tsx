import { createFileRoute } from '@tanstack/react-router'

import { TodoFilters } from '#/components/todo-filters.tsx'
import { TodoList } from '#/components/todo-list.tsx'
import { todosQueryOptions } from '#/lib/queries.ts'
import { todoSearchSchema } from '#/lib/validation.ts'

export const Route = createFileRoute('/')({
  // the url is the source of truth for search, status and sort, so views are shareable
  validateSearch: todoSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(todosQueryOptions(deps)),
  component: Home,
})

function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Todo</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Search, filter, and track what needs doing.
        </p>
      </header>

      <TodoFilters />
      <TodoList />
    </main>
  )
}
