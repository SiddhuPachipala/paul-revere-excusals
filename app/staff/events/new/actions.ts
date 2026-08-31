'use server'

import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireStaff()

  const name = String(formData.get('name') || '').trim()
  const company = String(formData.get('company') || 'ALL')
  const start = String(formData.get('start_at') || '')
  const end = String(formData.get('end_at'))
  const deadline = String(formData.get('request_deadline'))
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  const deadlineDate = deadline ? new Date(deadline) : null

  if (!name || !start || Number.isNaN(startDate.getTime())) {
    redirect('/staff/events?error=Enter%20a%20valid%20event%20name%20and%20start%20time.')
  }
  if (!['ALL', 'A', 'B', 'C'].includes(company)) {
    redirect('/staff/events?error=Select%20a%20valid%20company.')
  }
  if ((endDate && Number.isNaN(endDate.getTime())) || (deadlineDate && Number.isNaN(deadlineDate.getTime()))) {
    redirect('/staff/events?error=Enter%20valid%20end%20and%20deadline%20times.')
  }

  const { error } = await supabase.from('events').insert({
    name, event_type: String(formData.get('event_type')||''),
    start_at: startDate.toISOString(),
    end_at: endDate ? endDate.toISOString() : null,
    location: String(formData.get('location')||''), company,
    request_deadline: deadlineDate ? deadlineDate.toISOString() : null,
    makeup_instructions: String(formData.get('makeup_instructions')||''), created_by: user.id, is_active: true
  })
  if (error) redirect(`/staff/events?error=${encodeURIComponent(error.message)}`)
  redirect('/staff?message=Event%20created')
}
