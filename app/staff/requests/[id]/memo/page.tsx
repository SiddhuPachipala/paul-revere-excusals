import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { armyDate } from '@/lib/format'
import { PrintButton } from '@/components/PrintButton'

export default async function MemoPage({ params }:{params:Promise<{id:string}>}){
  const {id}=await params; const {supabase}=await requireStaff()
  const {data:r}=await supabase.from('excusal_requests').select('memo_snapshot,status').eq('id',id).single()
  if(!r||r.status!=='approved'||!r.memo_snapshot) notFound()
  const m = r.memo_snapshot; const today=armyDate(new Date().toISOString())
  return <main><div className="no-print" style={{maxWidth:850,margin:'20px auto 0',padding:'0 20px'}}><PrintButton/></div><article className="memo">
    <p className="right" style={{marginTop:45}}>ATCC-BBM-AMI&nbsp;&nbsp;&nbsp; {today}</p>
    <p><b>MEMORANDUM THRU</b> {m.company_commander || 'c/CPT Company Commander'}, c/CO, {m.company || '___'} COMPANY<br/>Paul Revere Battalion, MIT, 201 Vassar St., Cambridge, MA 02139</p>
    <p><b>MEMORANDUM FOR</b> {m.ms_instructor || 'MS Instructor'}, PROFESSOR, Professor of Military Science,<br/>Paul Revere Battalion, MIT, 201 Vassar St., Cambridge, MA 02139</p>
    <p><b>SUBJECT:</b> Request for Excused Absence</p>
    <p>1. I am requesting permission to be excused from <b>{m.event_name}</b> on <b>{armyDate(m.event_date)}</b>.</p>
    <p>2. I am requesting permission for this absence because {m.reason}</p>
    <p>3. My plan to make up this {m.event_name} is to {m.makeup_plan}</p>
    <p>4. Point of contact for this memorandum is the undersigned at {m.phone || '(xxx) xxx-xxxx'} or via email at {m.email || 'EMAIL'}.</p>
    <div className="sig"><b>{String(m.cadet_name||'FIRST LAST').toUpperCase()}</b><br/>CDT, USA<br/>{m.position || 'POSITION'}</div>
  </article></main>
}
