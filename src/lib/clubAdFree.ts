/**
 * Promotional period: club (company) ad_package activation without payment.
 * Set `NEXT_PUBLIC_CLUB_AD_FREE=false` to charge again.
 */
export function isClubAdFreePeriod(): boolean {
  return process.env.NEXT_PUBLIC_CLUB_AD_FREE !== 'false'
}
