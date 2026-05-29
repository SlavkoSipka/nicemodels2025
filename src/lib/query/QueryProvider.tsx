'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const ReactQueryDevtools = dynamic(
  async () =>
    (await import('@tanstack/react-query-devtools')).ReactQueryDevtools,
  { ssr: false },
)

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Public listing/profile data changes slowly; a longer stale window
        // avoids refetch churn as users navigate around on mobile.
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  })
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  )
}
