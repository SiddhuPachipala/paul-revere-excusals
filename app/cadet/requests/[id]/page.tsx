import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { resubmitExcusal } from './actions'
import { oneRelation } from '@/lib/relation'

export default async function ReviseRequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const { data: request } = await supabase
    .from('excusal_requests')
    .select('id,reason,makeup_plan,status,staff_notes,events(name)')
    .eq('id', id)
    .eq('cadet_id', user.id)
    .single()

  if (!request || request.status !== 'changes_requested') notFound()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const event = oneRelation(request.events)

  return <><Nav staff={isStaff} admin={profile.role === 'admin'}/><main className="shell"><section className="hero"><div className="eyebrow">Revise Excusal</div><h1 className="h1">{event?.name}</h1><p className="sub">Update the requested information and send it back for review.</p></section><form action={resubmitExcusal.bind(null, id)} className="card stack">{sp.error && <div className="notice" style={{background:'#f9e8e7'}}>{sp.error}</div>}{request.staff_notes && <div className="notice"><b>Staff note:</b> {request.staff_notes}</div>}<label><span className="label">Reason for absence</span><textarea className="field textarea" name="reason" defaultValue={request.reason} required /></label><label><span className="label">Plan to make up the event</span><textarea className="field textarea" name="makeup_plan" defaultValue={request.makeup_plan} required /></label><div><button className="btn" type="submit">Resubmit request</button></div></form></main></>
}
