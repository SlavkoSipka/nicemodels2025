import type { AbstractIntlMessages } from 'next-intl'

/**
 * Namespaces used only behind login. `dashboard` and `admin` make up most of
 * the message catalog, so public routes receive `publicMessages` instead of
 * the full set; `/dashboard` and `/register` mount their own provider with
 * everything.
 *
 * A public page that needs a key from these namespaces must get its own
 * provider, otherwise `useTranslations` reports a missing message.
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
