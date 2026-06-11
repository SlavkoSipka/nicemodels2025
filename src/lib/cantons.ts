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
  GR: 'Graubünden GR',
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

/**
 * Some neighbouring cantons are treated as a single location everywhere they
 * are displayed, filtered, and selected. Members map to a canonical group
 * code; the underlying ISO codes are kept intact in the cities table, geo-IP
 * cookie, and banner targeting.
 */
const CANTON_GROUP: Record<string, string> = {
  BL: 'BS', // Basel-Land + Basel-Stadt → Basel
  AR: 'AI', // Appenzell A. + Appenzell I. → Appenzell AI/AR
}

/** Display labels for canonical group codes (override CANTON_NAMES). */
const GROUP_LABELS: Record<string, string> = {
  BS: 'Basel',
  AI: 'Appenzell AI/AR',
}

/** Map any canton code to its canonical group code (identity when ungrouped). */
export function cantonGroup(code: string | null | undefined): string {
  if (!code) return ''
  return CANTON_GROUP[code] ?? code
}

/** Maximum number of cantons a banner buyer may target in one purchase. */
export const MAX_BANNER_REGIONS = 4

/** Largest cantons by population — quick-pick (sized to MAX_BANNER_REGIONS). */
export const TOP_CANTONS = ['ZH', 'BE', 'VD', 'AG'] as const

/**
 * Canonical group codes offered in selectors and region dropdowns — raw codes
 * that collapse into another group (BL, AR) are dropped.
 */
export const SELECTABLE_REGIONS = CANTON_CODES.filter(c => !(c in CANTON_GROUP))

export function cantonName(code: string): string {
  const group = cantonGroup(code)
  return GROUP_LABELS[group] || CANTON_NAMES[group] || code
}

export function isValidCanton(code: string | null | undefined): code is string {
  return !!code && VALID_CANTONS.has(code)
}
