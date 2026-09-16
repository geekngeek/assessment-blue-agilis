import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      // keeps SSR-hydrated data fresh so queries don't refetch on mount and desync hydration
      queries: { staleTime: 60_000 },
    },
  })

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
