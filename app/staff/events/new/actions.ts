'use server'

import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { parseNewYorkLocal } from '@/lib/event-time'

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireStaff()

  const name = String(formData.get('name') || '').trim()
  const company = String(formData.get('company') || 'ALL')
  const start = String(formData.get('start_at') || '')
  const end = String(formData.get('end_at'))
  const deadline = String(formData.get('request_deadline'))
  const startDate = parseNewYorkLocal(start)
  const endDate = end ? parseNewYorkLocal(end) : null
  const deadlineDate = deadline ? parseNewYorkLocal(deadline) : null

  if (!name || !startDate) {
    redirect('/staff/events?error=Enter%20a%20valid%20event%20name%20and%20start%20time.')
  }
  if (!['ALL', 'A', 'B', 'C'].includes(company)) {
    redirect('/staff/events?error=Select%20a%20valid%20company.')
  }
  if ((end && !endDate) || (deadline && !deadlineDate)) {
    redirect('/staff/events?error=Enter%20valid%20end%20and%20deadline%20times.')
  }
  if (endDate && endDate <= startDate) {
    redirect('/staff/events?error=The%20event%20end%20must%20be%20after%20its%20start.')
  }
  if (deadlineDate && deadlineDate > startDate) {
    redirect('/staff/events?error=The%20excusal%20deadline%20cannot%20be%20after%20the%20event%20starts.')
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
