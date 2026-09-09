import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateOnly, fmtDateTime } from '@/lib/format'
import { oneRelation } from '@/lib/relation'
import { reviewDatedPtRequest, reviewSemesterPtRequest } from './actions'

export default async function StaffSemesterPtPage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams
  const { supabase, user, profile } = await requireStaff()
  const { data: datedData, error: datedError } = await supabase.from('pt_excusal_requests').select('id,pt_date,reason,status,staff_notes,submitted_at,cadet_id,profiles!pt_excusal_requests_cadet_id_fkey(first_name,last_name,email,company,ms_level)').order('pt_date', { ascending: true })
  const datedRequests = (datedData || []).map((request) => ({ ...request, cadet: oneRelation(request.profiles) }))
  const { data, error } = await supabase.from('semester_pt_excusal_requests').select('id,semester,reason,status,staff_notes,submitted_at,cadet_id,profiles!semester_pt_excusal_requests_cadet_id_fkey(first_name,last_name,email,company,ms_level)').order('submitted_at', { ascending: false })
  const requests = (data || []).map((request) => ({ ...request, cadet: oneRelation(request.profiles) }))

  return <><Nav staff admin={profile.role === 'admin'} /><main className="shell">
    <section className="hero"><div className="eyebrow">Staff · PT Excusals</div><h1 className="h1">PT request queue</h1><p className="sub">Review date-specific and semester-long physical-training excusals without creating PT events.</p></section>
    {sp.error && <div className="notice" style={{background:'#f9e8e7',marginBottom:16}}>{sp.error}</div>}
    {sp.message && <div className="notice" style={{marginBottom:16}}>{sp.message}</div>}
    {datedError && <div className="notice">Could not load dated requests: {datedError.message}</div>}
    <h2>Requests by date</h2>
    <div className="stack">{!datedRequests.length ? <div className="card"><p className="muted">No dated PT requests yet.</p></div> : datedRequests.map((request) => <section className="card grid" key={request.id}>
      <div className="span8 stack"><div className="row"><div><h2 style={{margin:0}}>{request.cadet?.first_name} {request.cadet?.last_name}</h2><div className="small muted"><b>{fmtDateOnly(request.pt_date)}</b> · {request.cadet?.company} Company · {request.cadet?.ms_level}<br/>{request.cadet?.email} · Submitted {fmtDateTime(request.submitted_at)}</div></div><span className={`tag ${request.status}`}>{request.status}</span></div><div><div className="label">Reason</div><div className="notice">{request.reason}</div></div>{request.staff_notes && request.status !== 'pending' && <div className="small"><b>Staff note:</b> {request.staff_notes}</div>}</div>
      <aside className="span4">{request.cadet_id === user.id ? <div className="notice">Another staff member must review your request.</div> : request.status !== 'pending' ? <div className="notice">This request has already been reviewed.</div> : <form className="stack"><label><span className="label">Staff note</span><textarea className="field textarea" name="staff_notes" placeholder="Optional note to the cadet" /></label><button className="btn" formAction={reviewDatedPtRequest.bind(null, request.id, 'approved')} type="submit">Approve</button><button className="btn danger" formAction={reviewDatedPtRequest.bind(null, request.id, 'denied')} type="submit">Deny</button></form>}</aside>
    </section>)}</div>
    <h2 style={{marginTop:32}}>Semester-long requests</h2>
    {error && <div className="notice">Could not load semester requests: {error.message}</div>}
    <div className="stack">{!requests.length ? <div className="card"><p className="muted">No semester PT requests yet.</p></div> : requests.map((request) => <section className="card grid" key={request.id}>
      <div className="span8 stack"><div className="row"><div><h2 style={{margin:0}}>{request.cadet?.first_name} {request.cadet?.last_name}</h2><div className="small muted">{request.semester} · {request.cadet?.company} Company · {request.cadet?.ms_level}<br/>{request.cadet?.email} · Submitted {fmtDateTime(request.submitted_at)}</div></div><span className={`tag ${request.status}`}>{request.status}</span></div><div><div className="label">Reason</div><div className="notice">{request.reason}</div></div>{request.staff_notes && request.status !== 'pending' && <div className="small"><b>Staff note:</b> {request.staff_notes}</div>}</div>
      <aside className="span4">{request.cadet_id === user.id ? <div className="notice">Another staff member must review your request.</div> : request.status !== 'pending' ? <div className="notice">This request has already been reviewed.</div> : <form className="stack"><label><span className="label">Staff note</span><textarea className="field textarea" name="staff_notes" placeholder="Optional note to the cadet" /></label><button className="btn" formAction={reviewSemesterPtRequest.bind(null, request.id, 'approved')} type="submit">Approve</button><button className="btn danger" formAction={reviewSemesterPtRequest.bind(null, request.id, 'denied')} type="submit">Deny</button></form>}</aside>
    </section>)}</div>
  </main></>
}
