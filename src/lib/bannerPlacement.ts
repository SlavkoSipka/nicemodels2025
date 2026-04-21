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
