/**
 * Swiss canton ISO codes + display names.
 * Centralized so UI components, banner targeting, region filters, and
 * geo-IP middleware all share one source of truth.
 *
 * Includes FL (Liechtenstein) since the platform is used cross-border.
 */

export const CANTON_NAMES: Record<string, string> = {
  AG: 'Aargau',
  AI: 'Appenzell I.',
  AR: 'Appenzell A.',
  BE: 'Bern',
  BL: 'Basel-Land',
  BS: 'Basel-Stadt',
  FR: 'Fribourg',
  GE: 'Geneva',
  FL: 'Liechtenstein',
  GL: 'Glarus',
  GR: 'Grisons',
  JU: 'Jura',
  LU: 'Lucerne',
  NE: 'Neuchâtel',
  NW: 'Nidwalden',
  OW: 'Obwalden',
  SG: 'St. Gallen',
  SH: 'Schaffhausen',
  SO: 'Solothurn',
  SZ: 'Schwyz',
  TG: 'Thurgau',
  TI: 'Ticino',
  UR: 'Uri',
  VD: 'Vaud',
  VS: 'Valais',
  ZG: 'Zug',
  ZH: 'Zürich',
}

export const CANTON_CODES = Object.keys(CANTON_NAMES) as string[]

export const TOTAL_CANTONS = CANTON_CODES.length // 27

export const VALID_CANTONS = new Set(CANTON_CODES)

/** Maximum number of cantons a banner buyer may target in one purchase. */
export const MAX_BANNER_REGIONS = 4

/** Largest cantons by population — quick-pick (sized to MAX_BANNER_REGIONS). */
export const TOP_CANTONS = ['ZH', 'BE', 'VD', 'AG'] as const

export function cantonName(code: string): string {
  return CANTON_NAMES[code] || code
}

export function isValidCanton(code: string | null | undefined): code is string {
  return !!code && VALID_CANTONS.has(code)
}
