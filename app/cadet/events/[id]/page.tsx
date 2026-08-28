import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { submitExcusal } from './actions'

export default async function RequestPage({ params, searchParams }: { params: Promise<{id:string}>, searchParams: Promise<{error?:string}> }) {
  const { id } = await params; const sp = await searchParams
  const { supabase, profile } = await getCurrentUserWithProfile()
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) notFound()

  const action = submitExcusal.bind(null, id)
  return <><Nav/><main className="shell"><section className="hero"><div className="eyebrow">Request Excusal</div><h1 className="h1">{event.name}</h1><p className="sub">{fmtDateTime(event.start_at)}{event.location ? ` · ${event.location}` : ''}</p></section>
    <div className="grid"><form action={action} className="card span8 stack">{sp.error && <div className="notice" style={{background:'#f9e8e7'}}>{sp.error}</div>}
      <div><div className="label">Reason for absence</div><textarea className="field textarea" name="reason" placeholder="Explain why you are requesting permission to be excused." required /></div>
      <div><div className="label">Plan to make up the event</div><textarea className="field textarea" name="makeup_plan" placeholder="Describe how you will make up the missed training or requirement." required /></div>
      {event.makeup_instructions && <div className="notice"><b>Event guidance:</b> {event.makeup_instructions}</div>}
      <div><button className="btn" type="submit">Submit request</button></div>
    </form><aside className="card span4"><div className="eyebrow">Memo details</div><p className="small">The generated memorandum will use the following profile information:</p><p className="small"><b>{profile.first_name} {profile.last_name}</b><br/>{profile.email}<br/>{profile.phone || 'Phone not set'}<br/>{profile.company ? `${profile.company} Company` : 'Company not set'}<br/>{profile.ms_instructor || 'MS instructor not set'}<br/>{profile.company_commander || 'Company commander not set'}<br/>{profile.position || 'Position not set'}</p></aside></div>
  </main></>
}
