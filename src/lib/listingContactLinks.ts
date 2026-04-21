/** Digits only, full international number without + (e.g. 41791234567). */
export function listingPhoneDigits(countryCode: string, phone: string): string {
  const cc = (countryCode || '').replace(/\D/g, '')
  const pn = (phone || '').replace(/\D/g, '')
  return `${cc}${pn}`
}

export function listingTelHref(countryCode: string, phone: string): string {
  const d = listingPhoneDigits(countryCode, phone)
  return d ? `tel:+${d}` : '#'
}

export function listingSmsHref(countryCode: string, phone: string): string {
  const d = listingPhoneDigits(countryCode, phone)
  return d ? `sms:+${d}` : '#'
}

export function listingWhatsAppHref(countryCode: string, phone: string): string {
  const d = listingPhoneDigits(countryCode, phone)
  return d ? `https://wa.me/${d}` : '#'
}

/** Viber deep link (mobile). */
export function listingViberHref(countryCode: string, phone: string): string {
  const d = listingPhoneDigits(countryCode, phone)
  return d ? `viber://chat?number=${d}` : '#'
}

/** Telegram by phone (t.me/+...). */
export function listingTelegramHref(countryCode: string, phone: string): string {
  const d = listingPhoneDigits(countryCode, phone)
  return d ? `https://t.me/+${d}` : '#'
}
