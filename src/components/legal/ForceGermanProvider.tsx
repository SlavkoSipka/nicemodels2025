import { NextIntlClientProvider } from 'next-intl'
import deMessages from '../../../messages/de.json'

/**
 * Wraps children in a next-intl provider that forces German regardless of the
 * user's selected locale. Used on legal pages (AGB / Datenschutz) so the
 * binding contractual text always renders in the original German per Swiss
 * legal requirements.
 */
export default function ForceGermanProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="de" messages={deMessages as Record<string, unknown>}>
      {children}
    </NextIntlClientProvider>
  )
}
