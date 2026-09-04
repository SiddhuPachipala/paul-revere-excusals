import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { reviewRequest } from './actions'
import { oneRelation } from '@/lib/relation'

export default async function ReviewPage({ params, searchParams }: { params: Promise<{id:string}>, searchParams: Promise<{error?:string,message?:string}> }) {
  const { id } = await params; const sp = await searchParams
  const { supabase, user, profile } = await requireStaff()
  const { data:r } = await supabase.from('excusal_requests').select('*,profiles!excusal_requests_cadet_id_fkey(*),events(*)').eq('id',id).single()
  if (!r) notFound()
  const p = oneRelation(r.profiles)
  const e = oneRelation(r.events)
  if (!p || !e) notFound()
  const isOwnRequest = r.cadet_id === user.id
  return <><Nav staff admin={profile.role === 'admin'}/><main className="shell"><section className="hero"><div className="eyebrow">Staff · Review</div><h1 className="h1">{p.first_name} {p.last_name}</h1><p className="sub">{e.name} · {fmtDateTime(e.start_at)}</p></section>{sp.error&&<div className="notice" style={{background:'#f9e8e7',marginBottom:16}}>{sp.error}</div>}{sp.message&&<div className="notice" style={{marginBottom:16}}>{sp.message}</div>}<div className="grid"><section className="card span8 stack"><div><span className={`tag ${r.status}`}>{r.status.replace('_',' ')}</span></div><div><div className="label">Reason</div><div className="notice">{r.reason}</div></div><div><div className="label">Makeup plan</div><div className="notice">{r.makeup_plan}</div></div><div><div className="label">Cadet information</div><p className="small">{p.email}<br/>{p.phone||'No phone'}<br/>{p.company||'No company'} Company<br/>{p.ms_instructor||'No instructor'}<br/>{p.company_commander||'No commander'}<br/>{p.position||'No position'}</p></div>{r.status==='approved'&&<Link className="btn secondary" href={`/staff/requests/${id}/memo`}>Open memorandum</Link>}</section><aside className="card span4">{isOwnRequest ? <div className="notice">Another staff member must review your excusal request.</div> : r.status !== 'pending' ? <div className="notice">This request has already been reviewed.</div> : <form className="stack"><div><div className="label">Staff note</div><textarea className="field textarea" name="staff_notes" defaultValue={r.staff_notes||''} placeholder="Optional note to the cadet" /></div><button formAction={reviewRequest.bind(null,id,'approved')} className="btn" type="submit">Approve</button><button formAction={reviewRequest.bind(null,id,'changes_requested')} className="btn amber" type="submit">Request changes</button><button formAction={reviewRequest.bind(null,id,'denied')} className="btn danger" type="submit">Deny</button></form>}</aside></div></main></>
}
