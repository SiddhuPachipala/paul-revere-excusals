'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const start = String(formData.get('start_at'))
  const end = String(formData.get('end_at'))
  const deadline = String(formData.get('request_deadline'))
  const { error } = await supabase.from('events').insert({
    name: String(formData.get('name')||''), event_type: String(formData.get('event_type')||''),
    start_at: start ? new Date(start).toISOString() : null,
    end_at: end ? new Date(end).toISOString() : null,
    location: String(formData.get('location')||''), company: String(formData.get('company')||'ALL'),
    request_deadline: deadline ? new Date(deadline).toISOString() : null,
    makeup_instructions: String(formData.get('makeup_instructions')||''), created_by: user.id, is_active: true
  })
  if (error) redirect(`/staff/events/new?error=${encodeURIComponent(error.message)}`)
  redirect('/staff?message=Event%20created')
}
