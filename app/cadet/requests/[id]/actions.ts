'use server'

import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'

export async function resubmitExcusal(requestId: string, formData: FormData) {
  const { supabase, user } = await getCurrentUserWithProfile()
  const reason = String(formData.get('reason') || '').trim()
  const makeupPlan = String(formData.get('makeup_plan') || '').trim()

  if (!reason || !makeupPlan) {
    redirect(`/cadet/requests/${requestId}?error=Complete%20both%20fields%20before%20resubmitting.`)
  }

  const { data, error } = await supabase
    .from('excusal_requests')
    .update({ reason, makeup_plan: makeupPlan, status: 'pending' })
    .eq('id', requestId)
    .eq('cadet_id', user.id)
    .eq('status', 'changes_requested')
    .select('id')
    .maybeSingle()

  if (error) redirect(`/cadet/requests/${requestId}?error=${encodeURIComponent(error.message)}`)
  if (!data) redirect('/cadet/requests?message=This%20request%20is%20not%20available%20for%20revision.')
  redirect('/cadet/requests?message=Excusal%20request%20revised%20and%20resubmitted.')
}
