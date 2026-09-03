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

export const positionOptions = [
  'Battalion Commander',
  'Executive Officer',
  'Command Sergeant Major (MS3)',
  'Chaplain',
  'HROTC Association (MS3)',
  'MITROTC Association Co-Chair',
  'S1 - Adjutant',
  'S2 - Intelligence/Recruiting',
  'S3 - Operations',
  'Operations Sergeant Major (MS3)',
  'S4 - Logistics',
  'S6 - Communications',
  'Cadet Summer Trainer',
  'Cadet Summer Trainer (BC)',
  'SPO',
  'MIT Public Affairs Officer',
  'BC Public Affairs Officer',
  'Website Engineer',
  'Ranger Challenge (MS3)',
  'Hackathon',
  'MSI (MS3)',
  'STEAM Ahead (MS2)',
  'Company Commander',
  'First Sergeant',
  'Color Guard Captain',
  'PDO',
  'A/PDO',
  'Platoon Leader',
  'Platoon Sergeant',
  'Squad Leader',
  'A Team Leader',
  'B Team Leader',
  'Not assigned',
] as const

export type ExcusalProfile = Record<(typeof requiredProfileFields)[number], string | null>

export function missingProfileFields(profile: ExcusalProfile) {
  return requiredProfileFields.filter((field) => !profile[field]?.trim())
}

export function isProfileComplete(profile: ExcusalProfile) {
  return missingProfileFields(profile).length === 0
}
