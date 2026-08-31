import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { createEvent } from './new/actions'

export default async function NewEvent({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  await requireStaff(); const sp = await searchParams
  return <><Nav staff/><main className="shell"><section className="hero"><div className="eyebrow">Staff · Events</div><h1 className="h1">Create event</h1><p className="sub">Publishing an event makes it available to the applicable cadets for excusal requests.</p></section><form action={createEvent} className="card formgrid">{sp.error && <div className="notice full" style={{background:'#f9e8e7'}}>{sp.error}</div>}
    <div className="full"><div className="label">Event name</div><input className="field" name="name" placeholder="Leadership Lab" required /></div>
    <div><div className="label">Event type</div><select className="field" name="event_type"><option>Lab</option><option>PT</option><option>FTX</option><option>Class</option><option>Other</option></select></div>
    <div><div className="label">Applicable company</div><select className="field" name="company"><option value="ALL">All cadets</option><option value="A">A Company</option><option value="B">B Company</option><option value="C">C Company</option></select></div>
    <div><div className="label">Start</div><input className="field" type="datetime-local" name="start_at" required /></div>
    <div><div className="label">End</div><input className="field" type="datetime-local" name="end_at" /></div>
    <div><div className="label">Location</div><input className="field" name="location" placeholder="MIT / Briggs Field / etc." /></div>
    <div><div className="label">Excusal request deadline</div><input className="field" type="datetime-local" name="request_deadline" /></div>
    <div className="full"><div className="label">Default makeup guidance</div><textarea className="field textarea" name="makeup_instructions" placeholder="Optional instructions shown to cadets." /></div>
    <div className="full"><button className="btn" type="submit">Publish event</button></div>
  </form></main></>
}
