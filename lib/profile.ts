export const requiredProfileFields = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'ms_level',
  'ms_instructor',
  'company_commander',
  'position',
] as const

export type ExcusalProfile = Record<(typeof requiredProfileFields)[number], string | null>

export function missingProfileFields(profile: ExcusalProfile) {
  return requiredProfileFields.filter((field) => !profile[field]?.trim())
}

export function isProfileComplete(profile: ExcusalProfile) {
  return missingProfileFields(profile).length === 0
}
