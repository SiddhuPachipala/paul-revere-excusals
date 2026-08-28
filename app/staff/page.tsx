import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'

export default async function StaffDashboard() {
  const { supabase } = await requireStaff()
  const { data: requests } = await supabase.from('excusal_requests').select('id,status,submitted_at,profiles!excusal_requests_cadet_id_fkey(first_name,last_name,company),events(name,start_at)').order('submitted_at',{ascending:false})
  const pending = (requests||[]).filter(r=>r.status==='pending').length
  const { count: eventCount } = await supabase.from('events').select('*',{count:'exact',head:true}).eq('is_active',true).gte('start_at',new Date().toISOString())
  return <><Nav staff/><main className="shell"><section className="hero"><div className="eyebrow">Staff Portal</div><h1 className="h1">Excusal dashboard</h1><p className="sub">Create events, review cadet requests, and generate completed memoranda.</p></section><div className="grid" style={{marginBottom:18}}><div className="card span6"><div className="eyebrow">Pending</div><div className="stat">{pending}</div><div className="muted">requests awaiting review</div></div><div className="card span6"><div className="eyebrow">Upcoming</div><div className="stat">{eventCount||0}</div><div className="muted">active events</div></div></div><div className="card tablewrap"><div className="row" style={{marginBottom:12}}><h2 style={{margin:0}}>Recent requests</h2><Link className="btn" href="/staff/events/new">Create event</Link></div><table className="table"><thead><tr><th>Cadet</th><th>Event</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>{(requests||[]).map((r:any)=><tr key={r.id}><td><b>{r.profiles?.first_name} {r.profiles?.last_name}</b><div className="small muted">{r.profiles?.company ? `${r.profiles.company} Company` : ''}</div></td><td>{r.events?.name}<div className="small muted">{r.events?.start_at && fmtDateTime(r.events.start_at)}</div></td><td>{fmtDateTime(r.submitted_at)}</td><td><span className={`tag ${r.status}`}>{r.status.replace('_',' ')}</span></td><td><Link className="btn secondary" href={`/staff/requests/${r.id}`}>Review</Link></td></tr>)}</tbody></table></div></main></>
}
