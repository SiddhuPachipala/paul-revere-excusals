'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitExcusal(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reason = String(formData.get('reason') || '').trim()
  const makeup_plan = String(formData.get('makeup_plan') || '').trim()
  if (!reason || !makeup_plan) redirect(`/cadet/events/${eventId}?error=Please%20complete%20both%20fields.`)

  const { error } = await supabase.from('excusal_requests').insert({
    cadet_id: user.id,
    event_id: eventId,
    reason,
    makeup_plan,
  })
  if (error) redirect(`/cadet/events/${eventId}?error=${encodeURIComponent(error.message)}`)
  redirect('/cadet/requests?message=Excusal%20request%20submitted.')
}
