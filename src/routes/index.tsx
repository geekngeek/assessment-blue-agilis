import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import { getHello } from '#/server/hello'

// shared between the loader and the component so SSR and client hydration hit one cache entry
const helloQuery = queryOptions({
  queryKey: ['hello'],
  queryFn: () => getHello(),
})

export const Route = createFileRoute('/')({
  component: Home,
  loader: ({ context }) => context.queryClient.ensureQueryData(helloQuery),
})

function Home() {
  const { data, refetch, isFetching } = useSuspenseQuery(helloQuery)

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Todo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          TanStack Start scaffold — frontend and server functions wired up.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <p className="font-medium">{data.message}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-neutral-500">
          <dt>Runtime</dt>
          <dd className="font-mono">{data.runtime}</dd>
          <dt>Database</dt>
          <dd className="font-mono">{data.database}</dd>
          <dt>Responded</dt>
          <dd className="font-mono">{data.at}</dd>
        </dl>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-4 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isFetching ? 'Calling server…' : 'Call server again'}
        </button>
      </section>
    </main>
  )
}
