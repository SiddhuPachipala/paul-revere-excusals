import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'

export default async function CadetDashboard() {
  const { supabase, profile } = await getCurrentUserWithProfile()
  const { data: events } = await supabase.from('events').select('*').eq('is_active', true).gte('start_at', new Date().toISOString()).order('start_at')
  const { data: requests } = await supabase.from('excusal_requests').select('event_id,status')
  const requested = new Map((requests || []).map(r => [r.event_id, r.status]))
  const visible = (events || []).filter(e => e.company === 'ALL' || e.company === profile.company)

  return <><Nav/><main className="shell">
    <section className="hero"><div className="eyebrow">Cadet Portal</div><h1 className="h1">Upcoming events</h1><p className="sub">Request an excused absence from a scheduled battalion event and track the request through review.</p></section>
    <div className="grid"><section className="card span8">
      {visible.length === 0 ? <p className="muted">No upcoming events are currently open for excusal requests.</p> : visible.map(e => <div className="event" key={e.id}><div className="row"><div><h3>{e.name}</h3><div className="muted small">{fmtDateTime(e.start_at)}{e.location ? ` · ${e.location}` : ''}</div>{e.request_deadline && <div className="small muted">Request deadline: {fmtDateTime(e.request_deadline)}</div>}</div><div>{requested.has(e.id) ? <span className={`tag ${requested.get(e.id)}`}>{String(requested.get(e.id)).replace('_',' ')}</span> : <Link className="btn" href={`/cadet/events/${e.id}`}>Request excusal</Link>}</div></div></div>)}
    </section><aside className="card span4 stack"><div><div className="eyebrow">Your profile</div><h2 style={{margin:'6px 0'}}>{profile.first_name} {profile.last_name}</h2></div><div className="small"><b>Company:</b> {profile.company || 'Not set'}<br/><b>MS level:</b> {profile.ms_level || 'Not set'}<br/><b>Position:</b> {profile.position || 'Not set'}</div><div className="notice small">Your name, phone, email, company, instructor, commander, and position are pulled into the memorandum from your profile.</div></aside></div>
  </main></>
}
