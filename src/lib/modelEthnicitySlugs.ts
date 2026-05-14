export const MODEL_ETHNICITY_SLUGS = [
  'asian',
  'black',
  'caucasian_white',
  'latin',
  'mixed',
  'indian',
  'arab',
  'caucasian',
] as const

export type ModelEthnicitySlug = (typeof MODEL_ETHNICITY_SLUGS)[number]

export function isModelEthnicitySlug(value: string): value is ModelEthnicitySlug {
  return (MODEL_ETHNICITY_SLUGS as readonly string[]).includes(value)
}
