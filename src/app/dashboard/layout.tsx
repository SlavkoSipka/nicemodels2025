import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

/**
 * Root layout šalje klijentu samo javne namespace-ove kako bi HTML svake
 * javne stranice bio ~100 KB lakši (vidi `src/lib/i18n/messageScopes.ts`).
 * Dashboard je iza logina i koristi `dashboard.*` / `admin.*`, pa ovde
 * ponovo montiramo provider sa punim katalogom — ugnježdeni provider
 * pregazi onaj iz root layout-a za ceo /dashboard podstablo.
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
