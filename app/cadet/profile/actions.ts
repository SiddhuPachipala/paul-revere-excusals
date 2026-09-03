'use server'

import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { requiredProfileFields } from '@/lib/profile'

export async function updateProfile(formData: FormData) {
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const values = Object.fromEntries(
    requiredProfileFields.map((field) => [field, String(formData.get(field) || '').trim()])
  ) as Record<(typeof requiredProfileFields)[number], string>

  if (Object.values(values).some((value) => !value)) {
    redirect('/cadet/profile?error=Complete%20every%20profile%20field%20before%20saving.')
  }
  if (!['A', 'B', 'C'].includes(values.company)) {
    redirect('/cadet/profile?error=Select%20a%20valid%20company.')
  }
  if (!['MS I', 'MS II', 'MS III', 'MS IV'].includes(values.ms_level)) {
    redirect('/cadet/profile?error=Select%20a%20valid%20MS%20level.')
  }

  if (values.email.toLowerCase() !== String(profile.email).toLowerCase()) {
    const { error: authError } = await supabase.auth.updateUser({ email: values.email })
    if (authError) redirect(`/cadet/profile?error=${encodeURIComponent(authError.message)}`)
  }

  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', user.id)

  if (error) redirect(`/cadet/profile?error=${encodeURIComponent(error.message)}`)
  redirect('/cadet/profile?message=Profile%20saved.')
}
