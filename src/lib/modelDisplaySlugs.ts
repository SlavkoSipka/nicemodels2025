/**
 * Centralized mapping from DB enum slug -> next-intl translation key
 * for displayable model attributes (hair, eye, gender, pubic_hair, days, durations,
 * incall/outcall options).
 *
 * Keep namespaces stable; UI code uses `useTranslations(namespace)(key)` after lookup.
 */

export const MODEL_HAIR_SLUGS = ['blond', 'light_brown', 'brunette', 'black', 'red', 'other'] as const
export type ModelHairSlug = (typeof MODEL_HAIR_SLUGS)[number]

const HAIR_KEY_MAP: Record<ModelHairSlug, string> = {
  blond: 'hairBlond',
  light_brown: 'hairLightBrown',
  brunette: 'hairBrunette',
  black: 'hairBlack',
  red: 'hairRed',
  other: 'hairOther',
}

export function hairColorKey(slug: string | null | undefined): string | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, '_') as ModelHairSlug
  return HAIR_KEY_MAP[normalized] ?? null
}

export const MODEL_EYE_SLUGS = ['black', 'brown', 'green', 'blue', 'gray', 'hazel'] as const
export type ModelEyeSlug = (typeof MODEL_EYE_SLUGS)[number]

const EYE_KEY_MAP: Record<ModelEyeSlug, string> = {
  black: 'eyeBlack',
  brown: 'eyeBrown',
  green: 'eyeGreen',
  blue: 'eyeBlue',
  gray: 'eyeGray',
  hazel: 'eyeHazel',
}

export function eyeColorKey(slug: string | null | undefined): string | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, '_') as ModelEyeSlug
  return EYE_KEY_MAP[normalized] ?? null
}

export const MODEL_GENDER_SLUGS = ['female', 'male', 'trans'] as const
export type ModelGenderSlug = (typeof MODEL_GENDER_SLUGS)[number]

const GENDER_KEY_MAP: Record<ModelGenderSlug, string> = {
  female: 'genderFemale',
  male: 'genderMale',
  trans: 'genderTrans',
}

export function genderKey(slug: string | null | undefined): string | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase() as ModelGenderSlug
  return GENDER_KEY_MAP[normalized] ?? null
}

export const MODEL_PUBIC_SLUGS = ['shaved_completely', 'shaved_mostly', 'trimmed', 'all_natural'] as const
export type ModelPubicSlug = (typeof MODEL_PUBIC_SLUGS)[number]

const PUBIC_KEY_MAP: Record<ModelPubicSlug, string> = {
  shaved_completely: 'pubicShavedFull',
  shaved_mostly: 'pubicShavedMost',
  trimmed: 'pubicTrimmed',
  all_natural: 'pubicNatural',
}

export function pubicHairKey(slug: string | null | undefined): string | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, '_') as ModelPubicSlug
  return PUBIC_KEY_MAP[normalized] ?? null
}

export const DAY_OF_WEEK_SLUGS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type DayOfWeekSlug = (typeof DAY_OF_WEEK_SLUGS)[number]

/** Day index 0=Sunday .. 6=Saturday (matches JS Date.getDay() and DB convention). */
export function dayOfWeekKeyFromIndex(index: number): DayOfWeekSlug {
  const mapping: DayOfWeekSlug[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return mapping[index] ?? 'monday'
}

export function dayOfWeekKey(slug: string | null | undefined): DayOfWeekSlug | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase() as DayOfWeekSlug
  if ((DAY_OF_WEEK_SLUGS as readonly string[]).includes(normalized)) return normalized
  return null
}

export const RATE_DURATION_SLUGS = [
  '30_minutes',
  '1_hour',
  '2_hours',
  'additional_hour',
  'overnight',
  'dinner_date',
  'weekend',
  'specific_time',
] as const
export type RateDurationSlug = (typeof RATE_DURATION_SLUGS)[number]

const DURATION_KEY_MAP: Record<RateDurationSlug, string> = {
  '30_minutes': '30m',
  '1_hour': '1h',
  '2_hours': '2h',
  additional_hour: 'additional',
  overnight: 'overnight',
  dinner_date: 'dinner',
  weekend: 'weekend',
  specific_time: 'specific',
}

export function rateDurationKey(slug: string | null | undefined): string | null {
  if (!slug) return null
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, '_') as RateDurationSlug
  return DURATION_KEY_MAP[normalized] ?? null
}

/**
 * The onboarding form stores incall/outcall options as English-language strings
 * (e.g. "Private apartment", "Hotel room"). Map those raw values back to i18n keys
 * under `onboarding.model.incall.*` / `onboarding.model.outcall.*`.
 */
const INCALL_OPTION_KEY_MAP: Record<string, string> = {
  'private apartment': 'privateApt',
  'hotel room': 'hotel',
  'club/studio': 'club',
  other: 'other',
}

export function incallOptionKey(value: string | null | undefined): string | null {
  if (!value) return null
  return INCALL_OPTION_KEY_MAP[value.trim().toLowerCase()] ?? null
}

const OUTCALL_OPTION_KEY_MAP: Record<string, string> = {
  'hotel visits only': 'hotelOnly',
  'home visits only': 'homeOnly',
  'hotel and home visits': 'hotelHome',
  other: 'other',
}

export function outcallOptionKey(value: string | null | undefined): string | null {
  if (!value) return null
  return OUTCALL_OPTION_KEY_MAP[value.trim().toLowerCase()] ?? null
}
