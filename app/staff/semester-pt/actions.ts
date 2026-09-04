'use server'

import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'

export async function reviewSemesterPtRequest(requestId: string, status: 'approved' | 'denied', formData: FormData) {
  const { supabase, user } = await requireStaff()
  const staffNotes = String(formData.get('staff_notes') || '').trim()
  const { data, error } = await supabase
    .from('semester_pt_excusal_requests')
    .update({ status, staff_notes: staffNotes, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', requestId)
    .eq('status', 'pending')
    .neq('cadet_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) redirect(`/staff/semester-pt?error=${encodeURIComponent(error.message)}`)
  if (!data) redirect('/staff/semester-pt?error=This%20request%20cannot%20be%20reviewed.')
  redirect('/staff/semester-pt?message=PT%20excusal%20request%20updated.')
}
