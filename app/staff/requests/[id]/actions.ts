'use server'

import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { oneRelation } from '@/lib/relation'

export async function reviewRequest(requestId: string, status: 'approved'|'denied'|'changes_requested', formData: FormData) {
  const { supabase, user } = await requireStaff()

  const { data: request, error: requestError } = await supabase.from('excusal_requests').select('*,profiles!excusal_requests_cadet_id_fkey(*),events(*)').eq('id',requestId).single()
  if (requestError) redirect(`/staff/requests/${requestId}?error=${encodeURIComponent(requestError.message)}`)
  if (!request) redirect('/staff')
  if (request.cadet_id === user.id) {
    redirect(`/staff/requests/${requestId}?error=You%20cannot%20review%20your%20own%20excusal%20request.`)
  }
  if (request.status !== 'pending') {
    redirect(`/staff/requests/${requestId}?error=Only%20pending%20requests%20can%20be%20reviewed.`)
  }

  const p = oneRelation(request.profiles)
  const e = oneRelation(request.events)
  if (!p || !e) redirect(`/staff/requests/${requestId}?error=Request%20profile%20or%20event%20data%20is%20missing.`)
  const snapshot = status === 'approved' ? {
    cadet_name: `${p.first_name||''} ${p.last_name||''}`.trim(), phone:p.phone, email:p.email,
    company:p.company, company_commander:p.company_commander, ms_instructor:p.ms_instructor,
    position:p.position, event_name:e.name, event_date:e.start_at, reason:request.reason, makeup_plan:request.makeup_plan
  } : request.memo_snapshot

  const { data: updated, error } = await supabase.from('excusal_requests').update({
    status, staff_notes:String(formData.get('staff_notes')||''), reviewed_at:new Date().toISOString(), reviewed_by:user.id, memo_snapshot:snapshot
  }).eq('id',requestId).eq('status','pending').select('id').maybeSingle()
  if (error) redirect(`/staff/requests/${requestId}?error=${encodeURIComponent(error.message)}`)
  if (!updated) redirect(`/staff/requests/${requestId}?error=This%20request%20is%20no%20longer%20pending.`)
  redirect(`/staff/requests/${requestId}?message=Request%20updated`)
}
