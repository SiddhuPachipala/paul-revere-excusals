import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { updateProfile } from './actions'
import { positionOptions } from '@/lib/profile'

export default async function ProfilePage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams
  const { profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)

  return <>
    <Nav staff={isStaff} admin={profile.role === 'admin'} />
    <main className="shell">
      <section className="hero"><div className="eyebrow">Profile</div><h1 className="h1">Memo details</h1><p className="sub">Keep every field complete so your excusal memorandum can be generated correctly.</p></section>
      <form action={updateProfile} className="card formgrid">
        {sp.error && <div className="notice full" style={{background:'#f9e8e7'}}>{sp.error}</div>}
        {sp.message && <div className="notice full">{sp.message}</div>}
        <label><span className="label">First name</span><input className="field" name="first_name" defaultValue={profile.first_name || ''} required /></label>
        <label><span className="label">Last name</span><input className="field" name="last_name" defaultValue={profile.last_name || ''} required /></label>
        <label><span className="label">Email</span><input className="field" name="email" type="email" defaultValue={profile.email || ''} required /></label>
        <label><span className="label">Phone number</span><input className="field" name="phone" type="tel" defaultValue={profile.phone || ''} required /></label>
        <label><span className="label">Company</span><select className="field" name="company" defaultValue={profile.company || ''} required><option value="" disabled>Select company</option><option value="A">A Company</option><option value="B">B Company</option><option value="C">C Company</option></select></label>
        <label><span className="label">MS level</span><select className="field" name="ms_level" defaultValue={profile.ms_level || ''} required><option value="" disabled>Select MS level</option><option>MS I</option><option>MS II</option><option>MS III</option><option>MS IV</option></select></label>
        <label><span className="label">MS instructor</span><input className="field" name="ms_instructor" defaultValue={profile.ms_instructor || ''} required /></label>
        <label><span className="label">Company commander</span><input className="field" name="company_commander" defaultValue={profile.company_commander || ''} required /></label>
        <label className="full"><span className="label">Position</span><select className="field" name="position" defaultValue={profile.position || ''} required><option value="" disabled>Select position</option>{profile.position && !(positionOptions as readonly string[]).includes(profile.position) && <option value={profile.position}>{profile.position} (current)</option>}{positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}</select></label>
        <div className="full"><button className="btn" type="submit">Save profile</button></div>
      </form>
    </main>
  </>
}
