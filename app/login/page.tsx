import { login, signup } from '@/app/auth/actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const sp = await searchParams
  return <main className="loginwrap"><div className="login">
    <div className="card stack">
      <div><div className="eyebrow">Department of the Army</div><h1 style={{fontFamily:'Georgia,serif',margin:'6px 0 8px'}}>Paul Revere Battalion</h1><p className="muted" style={{margin:0}}>Cadet Excusal Portal</p></div>
      {sp.error && <div className="notice" style={{background:'#f9e8e7'}}>{sp.error}</div>}
      {sp.message && <div className="notice">{sp.message}</div>}
      <form action={login} className="stack">
        <div><div className="label">Email</div><input className="field" name="email" type="email" required /></div>
        <div><div className="label">Password</div><input className="field" name="password" type="password" required /></div>
        <button className="btn" type="submit">Sign in</button>
      </form>
      <details><summary style={{cursor:'pointer',fontWeight:750}}>New cadet? Create account</summary>
        <form action={signup} className="stack" style={{marginTop:14}}>
          <div className="formgrid"><div><div className="label">First name</div><input className="field" name="first_name" required /></div><div><div className="label">Last name</div><input className="field" name="last_name" required /></div></div>
          <div><div className="label">Email</div><input className="field" name="email" type="email" required /></div>
          <div><div className="label">Password</div><input className="field" name="password" type="password" minLength={8} required /></div>
          <button className="btn secondary" type="submit">Create account</button>
        </form>
      </details>
    </div>
  </div></main>
}
