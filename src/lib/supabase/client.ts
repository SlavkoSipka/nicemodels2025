import { createBrowserClient } from '@supabase/ssr'

// Singleton instance — prevents multiple simultaneous auth refresh calls
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) return clientInstance

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Catch network failures (e.g. "Failed to fetch") so they don't
        // bubble up as unhandled TypeErrors in the dev overlay.
        fetch: (input, init) =>
          fetch(input, init).catch(() =>
            new Response(
              JSON.stringify({ error: { message: 'Network unavailable', status: 503 } }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          ),
      },
    }
  )

  return clientInstance
}

