/**
 * Promotional period: model sedcard (ad_package) activation without payment.
 * Set `NEXT_PUBLIC_MODEL_SEDCARD_FREE=false` to charge again.
 */
export function isModelSedcardFreePeriod(): boolean {
  return process.env.NEXT_PUBLIC_MODEL_SEDCARD_FREE !== 'false'
}
