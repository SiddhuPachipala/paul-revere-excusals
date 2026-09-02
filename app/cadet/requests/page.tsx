import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { oneRelation } from '@/lib/relation'

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{message?:string}> }) {
  const sp = await searchParams
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const { data } = await supabase.from('excusal_requests').select('id,status,reason,makeup_plan,submitted_at,staff_notes,events(name,start_at)').eq('cadet_id', user.id).order('submitted_at',{ascending:false})
  const requests = (data || []).map((request) => ({
    ...request,
    event: oneRelation(request.events),
  }))
  return <><Nav staff={isStaff} admin={profile.role === 'admin'}/><main className="shell"><section className="hero"><div className="eyebrow">{isStaff ? 'Personal Excusals' : 'Cadet Portal'}</div><h1 className="h1">My requests</h1></section>{sp.message && <div className="notice" style={{marginBottom:16}}>{sp.message}</div>}<div className="card tablewrap"><table className="table"><thead><tr><th>Event</th><th>Submitted</th><th>Status</th><th>Staff note</th><th>Action</th></tr></thead><tbody>{requests.map((r)=><tr key={r.id}><td><b>{r.event?.name}</b><div className="small muted">{r.event?.start_at && fmtDateTime(r.event.start_at)}</div></td><td>{fmtDateTime(r.submitted_at)}</td><td><span className={`tag ${r.status}`}>{r.status.replace('_',' ')}</span></td><td className="small">{r.staff_notes || '—'}</td><td>{r.status === 'changes_requested' ? <Link className="btn secondary" href={`/cadet/requests/${r.id}`}>Revise</Link> : '—'}</td></tr>)}</tbody></table></div></main></>
}
