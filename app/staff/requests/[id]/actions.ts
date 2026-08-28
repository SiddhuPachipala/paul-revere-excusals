'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function reviewRequest(requestId: string, status: 'approved'|'denied'|'changes_requested', formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase.from('excusal_requests').select('*,profiles!excusal_requests_cadet_id_fkey(*),events(*)').eq('id',requestId).single()
  if (!request) redirect('/staff')

  const p:any = request.profiles; const e:any = request.events
  const snapshot = status === 'approved' ? {
    cadet_name: `${p.first_name||''} ${p.last_name||''}`.trim(), phone:p.phone, email:p.email,
    company:p.company, company_commander:p.company_commander, ms_instructor:p.ms_instructor,
    position:p.position, event_name:e.name, event_date:e.start_at, reason:request.reason, makeup_plan:request.makeup_plan
  } : request.memo_snapshot

  const { error } = await supabase.from('excusal_requests').update({
    status, staff_notes:String(formData.get('staff_notes')||''), reviewed_at:new Date().toISOString(), reviewed_by:user.id, memo_snapshot:snapshot
  }).eq('id',requestId)
  if (error) redirect(`/staff/requests/${requestId}?error=${encodeURIComponent(error.message)}`)
  redirect(`/staff/requests/${requestId}?message=Request%20updated`)
}
