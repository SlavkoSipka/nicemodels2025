import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

/**
 * The root layout ships only public message namespaces (see
 * `src/lib/i18n/messageScopes.ts`). The dashboard needs `dashboard.*` and
 * `admin.*`, so it mounts a provider with the full catalog; the nested
 * provider replaces the root one for the whole /dashboard subtree.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
