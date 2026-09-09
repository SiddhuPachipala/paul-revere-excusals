import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateOnly, fmtDateTime } from '@/lib/format'
import { isProfileComplete } from '@/lib/profile'
import { semesterOptions } from '@/lib/semester'
import { submitDatedPtExcusal, submitSemesterPtExcusal } from './actions'

function easternDateToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export default async function SemesterPtPage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const profileComplete = isProfileComplete(profile)
  const { data: datedRequests, error: datedLoadError } = await supabase
    .from('pt_excusal_requests')
    .select('id,pt_date,reason,status,staff_notes,submitted_at')
    .eq('cadet_id', user.id)
    .order('pt_date', { ascending: false })
  const { data: requests, error: loadError } = await supabase
    .from('semester_pt_excusal_requests')
    .select('id,semester,reason,status,staff_notes,submitted_at')
    .eq('cadet_id', user.id)
    .order('submitted_at', { ascending: false })

  return <><Nav staff={isStaff} admin={profile.role === 'admin'} /><main className="shell">
    <section className="hero"><div className="eyebrow">PT Excusals</div><h1 className="h1">Physical training excusals</h1><p className="sub">Choose a PT date without waiting for staff to create each session as an event.</p></section>
    {sp.error && <div className="notice" style={{background:'#f9e8e7',marginBottom:16}}>{sp.error}</div>}
    {sp.message && <div className="notice" style={{marginBottom:16}}>{sp.message}</div>}
    <div className="grid">
      <section className="card span6 stack">
        <h2 style={{margin:0}}>Miss one PT date</h2>
        {!profileComplete ? <><div className="notice">Complete every profile field before submitting.</div><div><Link className="btn" href="/cadet/profile">Complete profile</Link></div></> : <form action={submitDatedPtExcusal} className="stack">
          <label><span className="label">PT date</span><input className="field" type="date" name="pt_date" min={easternDateToday()} required /></label>
          <label><span className="label">Reason for absence</span><textarea className="field textarea" name="reason" placeholder="Explain why you need to miss PT on this date." required /></label>
          <div><button className="btn" type="submit">Submit dated request</button></div>
        </form>}
      </section>
      <section className="card span6 stack"><h2 style={{margin:0}}>My dated PT requests</h2>
        {datedLoadError && <div className="notice">Could not load dated requests: {datedLoadError.message}</div>}
        {!datedRequests?.length ? <p className="muted">No dated PT requests yet.</p> : datedRequests.map((request) => <div className="event" key={request.id}><div className="row"><div><b>{fmtDateOnly(request.pt_date)}</b><div className="small muted">Submitted {fmtDateTime(request.submitted_at)}</div></div><span className={`tag ${request.status}`}>{request.status}</span></div><p className="small">{request.reason}</p>{request.staff_notes && <div className="notice small"><b>Staff note:</b> {request.staff_notes}</div>}</div>)}
      </section>
      <section className="card span6 stack">
        <h2 style={{margin:0}}>Need the whole semester?</h2>
        <p className="muted small" style={{margin:0}}>Use this only for a semester-long PT exemption.</p>
        {profileComplete && <form action={submitSemesterPtExcusal} className="stack">
          <label><span className="label">Semester</span><select className="field" name="semester" defaultValue="" required><option value="" disabled>Select semester</option>{semesterOptions().map((semester) => <option key={semester}>{semester}</option>)}</select></label>
          <label><span className="label">Reason for semester-long PT excusal</span><textarea className="field textarea" name="reason" placeholder="Explain the circumstances and any relevant limitations." required /></label>
          <div><button className="btn secondary" type="submit">Submit semester request</button></div>
        </form>}
      </section>
      <section className="card span6 stack"><h2 style={{margin:0}}>My semester requests</h2>
        {loadError && <div className="notice">Could not load requests: {loadError.message}</div>}
        {!requests?.length ? <p className="muted">No semester-long PT requests yet.</p> : requests.map((request) => <div className="event" key={request.id}><div className="row"><div><b>{request.semester}</b><div className="small muted">Submitted {fmtDateTime(request.submitted_at)}</div></div><span className={`tag ${request.status}`}>{request.status}</span></div><p className="small">{request.reason}</p>{request.staff_notes && <div className="notice small"><b>Staff note:</b> {request.staff_notes}</div>}</div>)}
      </section>
    </div>
  </main></>
}
