import type { AbstractIntlMessages } from 'next-intl'

/**
 * Namespace-ovi koji postoje samo iza logina (dashboard + admin panel).
 *
 * `messages/de.json` je ~168 KB, a `dashboard` i `admin` zajedno su ~61% toga.
 * Root layout ih je slao u SVAKI HTML dokument preko `NextIntlClientProvider`,
 * pa je anonimni posetilac homepage-a skidao 100 KB prevoda za ekrane koje
 * nikada neće videti. Javne rute sada dobijaju samo `publicMessages`, a
 * `/dashboard/**` i `/register/**` imaju sopstveni provider sa punim setom
 * (vidi `src/app/dashboard/layout.tsx` i `src/app/register/layout.tsx`).
 *
 * Ako neka JAVNA stranica ikada zatreba `dashboard.*` ili `admin.*` ključ,
 * ili se namespace mora dodati ovde, ili taj deo stabla dobija svoj provider —
 * u suprotnom `useTranslations` puca na missing message.
 *
 * Kompromis: ugnježdeni `IntlProvider` iz use-intl ZAMENJUJE `messages`, ne
 * spaja ih sa roditeljskim. Zato /dashboard i /register serijalizuju katalog
 * dvaput — javni podskup iz root layout-a plus pun set iz svog providera,
 * ≈65 KB viška po strani. To su stranice iza logina koje se ne indeksiraju i
 * nisu deo LCP-a koji merimo, pa je razmena (−108 KB na SVAKOJ javnoj strani)
 * jasno pozitivna. Ako i to zasmeta, rešenje je da root layout dobije putanju
 * (npr. header iz `src/proxy.ts`) i sam bira set, čime ugnježdeni provideri
 * potpuno otpadaju.
 */
const AUTHENTICATED_ONLY_NAMESPACES = ['dashboard', 'admin'] as const

export function publicMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const scoped: Record<string, unknown> = {}
  for (const [namespace, value] of Object.entries(messages)) {
    if ((AUTHENTICATED_ONLY_NAMESPACES as readonly string[]).includes(namespace)) continue
    scoped[namespace] = value
  }
  return scoped as AbstractIntlMessages
}
