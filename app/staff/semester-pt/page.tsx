import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { oneRelation } from '@/lib/relation'
import { reviewSemesterPtRequest } from './actions'

export default async function StaffSemesterPtPage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams
  const { supabase, user, profile } = await requireStaff()
  const { data, error } = await supabase.from('semester_pt_excusal_requests').select('id,semester,reason,status,staff_notes,submitted_at,cadet_id,profiles!semester_pt_excusal_requests_cadet_id_fkey(first_name,last_name,email,company,ms_level)').order('submitted_at', { ascending: false })
  const requests = (data || []).map((request) => ({ ...request, cadet: oneRelation(request.profiles) }))

  return <><Nav staff admin={profile.role === 'admin'} /><main className="shell">
    <section className="hero"><div className="eyebrow">Staff · PT Excusals</div><h1 className="h1">Semester PT requests</h1><p className="sub">Review requests for semester-long physical-training excusals.</p></section>
    {sp.error && <div className="notice" style={{background:'#f9e8e7',marginBottom:16}}>{sp.error}</div>}
    {sp.message && <div className="notice" style={{marginBottom:16}}>{sp.message}</div>}
    {error && <div className="notice">Could not load requests: {error.message}</div>}
    <div className="stack">{!requests.length ? <div className="card"><p className="muted">No semester PT requests yet.</p></div> : requests.map((request) => <section className="card grid" key={request.id}>
      <div className="span8 stack"><div className="row"><div><h2 style={{margin:0}}>{request.cadet?.first_name} {request.cadet?.last_name}</h2><div className="small muted">{request.semester} · {request.cadet?.company} Company · {request.cadet?.ms_level}<br/>{request.cadet?.email} · Submitted {fmtDateTime(request.submitted_at)}</div></div><span className={`tag ${request.status}`}>{request.status}</span></div><div><div className="label">Reason</div><div className="notice">{request.reason}</div></div>{request.staff_notes && request.status !== 'pending' && <div className="small"><b>Staff note:</b> {request.staff_notes}</div>}</div>
      <aside className="span4">{request.cadet_id === user.id ? <div className="notice">Another staff member must review your request.</div> : request.status !== 'pending' ? <div className="notice">This request has already been reviewed.</div> : <form className="stack"><label><span className="label">Staff note</span><textarea className="field textarea" name="staff_notes" placeholder="Optional note to the cadet" /></label><button className="btn" formAction={reviewSemesterPtRequest.bind(null, request.id, 'approved')} type="submit">Approve</button><button className="btn danger" formAction={reviewSemesterPtRequest.bind(null, request.id, 'denied')} type="submit">Deny</button></form>}</aside>
    </section>)}</div>
  </main></>
}
