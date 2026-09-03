import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { currentTimestamp } from '@/lib/event-time'
import { submitExcusal } from './actions'
import { isProfileComplete } from '@/lib/profile'

export default async function RequestPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: existingRequest } = await supabase
    .from('excusal_requests')
    .select('id')
    .eq('event_id', id)
    .eq('cadet_id', user.id)
    .maybeSingle()
  const now = currentTimestamp()
  const unavailable = !event.is_active
    || new Date(event.start_at).getTime() <= now
    || Boolean(event.request_deadline && new Date(event.request_deadline).getTime() < now)
    || (event.company !== 'ALL' && event.company !== profile.company)
  const action = submitExcusal.bind(null, id)
  const profileComplete = isProfileComplete(profile)

  return <>
    <Nav staff={isStaff} admin={profile.role === 'admin'}/>
    <main className="shell">
      <section className="hero"><div className="eyebrow">Request Excusal</div><h1 className="h1">{event.name}</h1><p className="sub">{fmtDateTime(event.start_at)}{event.location ? ` · ${event.location}` : ''}</p></section>
      <div className="grid">
        {unavailable || existingRequest ? <section className="card span8"><div className="notice">{existingRequest ? 'You already submitted an excusal request for this event.' : 'This event is no longer available for excusal requests.'}</div></section> : !profileComplete ? <section className="card span8 stack"><div className="notice">Complete every profile field before submitting an excusal.</div><div><Link className="btn" href="/cadet/profile">Complete profile</Link></div></section> : <form action={action} className="card span8 stack">
          {sp.error && <div className="notice" style={{background:'#f9e8e7'}}>{sp.error}</div>}
          <div><div className="label">Reason for absence</div><textarea className="field textarea" name="reason" placeholder="Explain why you are requesting permission to be excused." required /></div>
          <div><div className="label">Plan to make up the event</div><textarea className="field textarea" name="makeup_plan" placeholder="Describe how you will make up the missed training or requirement." required /></div>
          {event.makeup_instructions && <div className="notice"><b>Event guidance:</b> {event.makeup_instructions}</div>}
          <div><button className="btn" type="submit">Submit request</button></div>
        </form>}
        <aside className="card span4 stack"><div><div className="eyebrow">Memo details</div><p className="small">The generated memorandum will use the following profile information:</p><p className="small"><b>Name:</b> {profile.first_name} {profile.last_name}<br/><b>Email:</b> {profile.email || 'Not set'}<br/><b>Phone:</b> {profile.phone || 'Not set'}<br/><b>Company:</b> {profile.company ? `${profile.company} Company` : 'Not set'}<br/><b>MS level:</b> {profile.ms_level || 'Not set'}<br/><b>MS instructor:</b> {profile.ms_instructor || 'Not set'}<br/><b>Company commander:</b> {profile.company_commander || 'Not set'}<br/><b>Position:</b> {profile.position || 'Not set'}</p></div><div><Link className="btn secondary" href="/cadet/profile">Edit profile</Link></div></aside>
      </div>
    </main>
  </>
}
