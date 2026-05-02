export type BannerPlacement = 'feed_wide' | 'feed_card' | 'sidebar_left'

export function normalizePlacement(p: string | undefined | null): BannerPlacement {
  if (p === 'feed_card' || p === 'sidebar_left') return p
  return 'feed_wide'
}

export function partitionBannersByPlacement<T extends { placement?: BannerPlacement | string | null }>(
  list: T[],
): { feedWide: T[]; feedCard: T[]; sidebarLeft: T[] } {
  const feedWide: T[] = []
  const feedCard: T[] = []
  const sidebarLeft: T[] = []
  for (const b of list) {
    const pl = normalizePlacement(b.placement as string | null)
    if (pl === 'feed_card') feedCard.push(b)
    else if (pl === 'sidebar_left') sidebarLeft.push(b)
    else feedWide.push(b)
  }
  return { feedWide, feedCard, sidebarLeft }
}

/**
 * Keep banners that match the visitor's canton.
 *
 * Rules:
 *  - NULL or empty `target_cantons` = banner targets all of CH; always shown.
 *  - Non-empty `target_cantons` = banner is shown only when `effectiveCanton`
 *    is one of those codes.
 *  - If `effectiveCanton` is null (visitor outside CH or geo-IP unknown),
 *    only "all-CH" banners pass.
 */
export function filterBannersByCanton<
  T extends { target_cantons?: string[] | null },
>(list: T[], effectiveCanton: string | null): T[] {
  return list.filter(b => {
    if (!b.target_cantons || b.target_cantons.length === 0) return true
    if (!effectiveCanton) return false
    return b.target_cantons.includes(effectiveCanton)
  })
}
