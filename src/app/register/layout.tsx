import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export const dynamic = 'force-dynamic'

/**
 * Registracioni wizard (`BiographyStep`) deli prevode sa dashboard-om
 * (`dashboard.model.biography`, `dashboard.model.common`), koje root layout
 * više ne šalje javnim rutama. Zato /register dobija pun katalog.
 * Vidi `src/lib/i18n/messageScopes.ts`.
 */
export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
