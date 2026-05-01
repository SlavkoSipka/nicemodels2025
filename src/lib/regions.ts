/**
 * Swiss macro-regions used for job/rent listing visibility.
 *
 * Each region groups one or more cantons. Listings tag themselves with one or
 * more region IDs and appear when a viewer filters by that region.
 */

export type RegionId =
  | 'zurich'
  | 'espace_mittelland'
  | 'nordwestschweiz'
  | 'zentralschweiz'
  | 'ostschweiz'
  | 'westschweiz'
  | 'tessin'
  | 'liechtenstein'

export interface Region {
  id: RegionId
  label: string
  /** Brief native label shown next to the main label. */
  subLabel?: string
  /** Canton codes that belong to this region. */
  cantons: string[]
}

export const REGIONS: Region[] = [
  { id: 'zurich',            label: 'Zürich',                                  cantons: ['ZH'] },
  { id: 'espace_mittelland', label: 'Espace Mittelland',  subLabel: 'BE / FR / JU / NE / SO', cantons: ['BE', 'FR', 'JU', 'NE', 'SO'] },
  { id: 'nordwestschweiz',   label: 'Nordwestschweiz',    subLabel: 'AG / BL / BS',           cantons: ['AG', 'BL', 'BS'] },
  { id: 'zentralschweiz',    label: 'Zentralschweiz',     subLabel: 'LU / NW / OW / SZ / UR / ZG', cantons: ['LU', 'NW', 'OW', 'SZ', 'UR', 'ZG'] },
  { id: 'ostschweiz',        label: 'Ostschweiz',         subLabel: 'AI / AR / GL / GR / SG / SH / TG', cantons: ['AI', 'AR', 'GL', 'GR', 'SG', 'SH', 'TG'] },
  { id: 'westschweiz',       label: 'Région lémanique',   subLabel: 'GE / VD / VS',           cantons: ['GE', 'VD', 'VS'] },
  { id: 'tessin',            label: 'Ticino',             subLabel: 'TI',                     cantons: ['TI'] },
  { id: 'liechtenstein',     label: 'Liechtenstein',      subLabel: 'FL',                     cantons: ['FL'] },
]

const ALL_REGION_IDS: RegionId[] = REGIONS.map(r => r.id)

const CANTON_TO_REGION: Map<string, RegionId> = (() => {
  const m = new Map<string, RegionId>()
  for (const r of REGIONS) {
    for (const c of r.cantons) m.set(c.toUpperCase(), r.id)
  }
  return m
})()

/** Return the region a canton belongs to, or null if unknown. */
export function regionForCanton(canton: string | null | undefined): RegionId | null {
  if (!canton) return null
  return CANTON_TO_REGION.get(canton.toUpperCase()) ?? null
}

/** Lookup by id. */
export function getRegion(id: string | null | undefined): Region | null {
  if (!id) return null
  return REGIONS.find(r => r.id === id) ?? null
}

/** True if `selected` covers all regions (either explicitly or empty). */
export function isAllRegions(selected: string[] | null | undefined): boolean {
  if (!selected || selected.length === 0) return true
  return ALL_REGION_IDS.every(id => selected.includes(id))
}

/** Render a comma-separated label list. Returns 'All regions' when applicable. */
export function formatRegions(selected: string[] | null | undefined): string {
  if (isAllRegions(selected)) return 'All regions'
  return selected!
    .map(id => getRegion(id)?.label)
    .filter(Boolean)
    .join(', ')
}

export { ALL_REGION_IDS }
