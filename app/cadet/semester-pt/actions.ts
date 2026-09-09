'use server'

import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { isProfileComplete } from '@/lib/profile'
import { semesterOptions } from '@/lib/semester'

function easternDateToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export async function submitDatedPtExcusal(formData: FormData) {
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const ptDate = String(formData.get('pt_date') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!isCalendarDate(ptDate) || ptDate < easternDateToday()) {
    redirect('/cadet/semester-pt?error=Select%20a%20current%20or%20future%20PT%20date.')
  }
  if (!reason) {
    redirect('/cadet/semester-pt?error=Explain%20why%20you%20are%20requesting%20the%20excusal.')
  }
  if (!isProfileComplete(profile)) {
    redirect('/cadet/semester-pt?error=Complete%20your%20profile%20before%20submitting%20a%20request.')
  }

  const { error } = await supabase.from('pt_excusal_requests').insert({
    cadet_id: user.id,
    pt_date: ptDate,
    reason,
  })

  if (error?.code === '23505') {
    redirect('/cadet/semester-pt?error=You%20already%20have%20a%20PT%20request%20for%20that%20date.')
  }
  if (error) redirect(`/cadet/semester-pt?error=${encodeURIComponent(error.message)}`)
  redirect('/cadet/semester-pt?message=PT%20excusal%20request%20submitted.')
}

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
