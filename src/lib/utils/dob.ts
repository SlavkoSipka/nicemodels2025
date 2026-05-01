/**
 * Date-of-birth helpers.
 *
 * - DB / API format:    YYYY-MM-DD (ISO)
 * - User-facing format: DD.MM.YYYY
 *
 * We store ISO and only format for display / input.
 */

/** Convert an ISO date (YYYY-MM-DD) to DD.MM.YYYY for display. Returns '' on bad input. */
export function formatDobDisplay(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

/**
 * Parse a user-typed DD.MM.YYYY string back to ISO YYYY-MM-DD.
 * Returns null when the input is incomplete or invalid (real calendar date).
 */
export function parseDobInput(s: string | null | undefined): string | null {
  if (!s) return null
  const m = String(s).match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  // Real-calendar check (e.g. reject 31.02.1987)
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/**
 * Auto-format raw keystrokes into DD.MM.YYYY as the user types.
 * - Strips non-digits
 * - Caps to 8 digits
 * - Inserts dots after positions 2 and 4
 *
 * Example: '25051987' -> '25.05.1987'; '2505' -> '25.05'; '25' -> '25'
 */
export function autoFormatDob(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

/** Get age in years for a given ISO date (YYYY-MM-DD). Returns null on bad input. */
export function ageFromIso(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}
