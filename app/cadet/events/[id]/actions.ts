'use server'

import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { isProfileComplete } from '@/lib/profile'

export async function submitExcusal(eventId: string, formData: FormData) {
  const { supabase, user, profile } = await getCurrentUserWithProfile()

  const reason = String(formData.get('reason') || '').trim()
  const makeup_plan = String(formData.get('makeup_plan') || '').trim()
  if (!reason || !makeup_plan) redirect(`/cadet/events/${eventId}?error=Please%20complete%20both%20fields.`)
  if (!isProfileComplete(profile)) {
    redirect(`/cadet/events/${eventId}?error=Complete%20your%20profile%20before%20submitting%20an%20excusal.`)
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('company,is_active,start_at,request_deadline')
    .eq('id', eventId)
    .single()

  const now = Date.now()
  const unavailable = eventError || !event || !event.is_active
    || new Date(event.start_at).getTime() <= now
    || (event.request_deadline && new Date(event.request_deadline).getTime() < now)
    || (event.company !== 'ALL' && event.company !== profile.company)

  if (unavailable) {
    redirect(`/cadet/events/${eventId}?error=This%20event%20is%20not%20available%20for%20an%20excusal%20request.`)
  }

  const { error } = await supabase.from('excusal_requests').insert({
    cadet_id: user.id,
    event_id: eventId,
    reason,
    makeup_plan,
  })
  if (error) redirect(`/cadet/events/${eventId}?error=${encodeURIComponent(error.message)}`)
  redirect('/cadet/requests?message=Excusal%20request%20submitted.')
}
