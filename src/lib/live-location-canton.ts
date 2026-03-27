/** Rows from `cities` used to map live_location_* → canton for region filters */
export type CityCantonRow = { name: string; postal_code: string | null; canton: string | null }

/** Resolve canton for a model’s live city; prefers postal match when multiple rows share a name */
export function resolveLiveLocationCanton(
  liveCity: string | null | undefined,
  livePostal: string | null | undefined,
  rows: CityCantonRow[],
): string | null {
  if (!liveCity || !rows.length) return null
  const matches = rows.filter((r) => r.name === liveCity)
  if (matches.length === 0) return null
  if (livePostal) {
    const exact = matches.find((r) => r.postal_code === livePostal)
    if (exact?.canton) return exact.canton
  }
  const first = matches.find((r) => r.canton)
  return first?.canton ?? null
}
