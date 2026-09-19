/**
 * Registry for the Help Point (`/hilfe`) articles.
 *
 * The hub page, the cross-links at the bottom of each article and the sitemap
 * all read from this one list, so adding a guide means adding an entry here
 * plus the matching route folder — nothing else needs touching.
 *
 * Copy is German-only, like /werden-model: the site resolves locale from a
 * cookie rather than the URL, so a translated guide would have no distinct URL
 * to be indexed at.
 */

export const HELP_PATH = '/hilfe'

export type HelpIcon = 'profile' | 'sedcard'

export interface HelpTopic {
  slug: string
  /** Full page title (also the <h1>). */
  title: string
  /** Short label for cards and cross-links. */
  short: string
  /** One-line summary, used on the hub cards and as the meta description. */
  description: string
  icon: HelpIcon
  /** Rough reading time in minutes, shown on the hub cards. */
  minutes: number
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: 'profil-erstellen',
    title: 'Profil erstellen – Schritt für Schritt',
    short: 'Profil erstellen',
    description:
      'Von der Registrierung über die Verifizierung bis zum fertig ausgefüllten Profil: alle Schritte erklärt, inklusive der Angaben, die dein Profil vollständig machen.',
    icon: 'profile',
    minutes: 5,
  },
  {
    slug: 'sedcard',
    title: 'Sedcard aktivieren und optimal gestalten',
    short: 'Sedcard',
    description:
      'Was eine Sedcard ist, wie du sie im Dashboard aktivierst, wie lange sie läuft und womit du sie sichtbarer machst.',
    icon: 'sedcard',
    minutes: 4,
  },
]

export function helpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find(t => t.slug === slug)
}

export function helpUrl(slug: string): string {
  return `${HELP_PATH}/${slug}`
}
