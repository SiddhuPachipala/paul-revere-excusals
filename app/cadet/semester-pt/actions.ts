'use server'

import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { isProfileComplete } from '@/lib/profile'
import { semesterOptions } from '@/lib/semester'

export async function submitSemesterPtExcusal(formData: FormData) {
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const semester = String(formData.get('semester') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!(semesterOptions() as string[]).includes(semester)) {
    redirect('/cadet/semester-pt?error=Select%20a%20valid%20semester.')
  }
  if (!reason) {
    redirect('/cadet/semester-pt?error=Explain%20why%20you%20are%20requesting%20the%20excusal.')
  }
  if (!isProfileComplete(profile)) {
    redirect('/cadet/semester-pt?error=Complete%20your%20profile%20before%20submitting%20a%20request.')
  }

  const { error } = await supabase.from('semester_pt_excusal_requests').insert({
    cadet_id: user.id,
    semester,
    reason,
  })

  if (error?.code === '23505') {
    redirect('/cadet/semester-pt?error=You%20already%20have%20a%20request%20for%20that%20semester.')
  }
  if (error) redirect(`/cadet/semester-pt?error=${encodeURIComponent(error.message)}`)
  redirect('/cadet/semester-pt?message=Semester-long%20PT%20excusal%20request%20submitted.')
}
