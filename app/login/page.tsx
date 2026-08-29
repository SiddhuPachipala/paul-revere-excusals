import { login, signup } from '@/app/auth/actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const sp = await searchParams
  return <main className="loginwrap">
    <section className="login-intro" aria-labelledby="login-title">
      <div className="login-mark" aria-hidden="true"><span>PR</span></div>
      <div className="login-kicker">Paul Revere Battalion · Excusal Ledger</div>
      <h1 id="login-title">Every absence<br />leaves a mark.</h1>
      <p className="login-deck">File requests, follow decisions, and keep the record moving—all from one shared desk.</p>
      <div className="login-folio" aria-hidden="true"><span>Est. 1775</span><i></i><span>Record No. 01</span></div>
    </section>
    <section className="login" aria-label="Account access">
    <div className="login-card stack">
      <header className="login-card-head"><span className="login-index">01 / ACCESS</span><div><h2>Open the ledger</h2><p>Use your battalion account to continue.</p></div></header>
      {sp.error && <div className="notice" style={{background:'#f9e8e7',color:'#6e2420'}}>{sp.error}</div>}
      {sp.message && <div className="notice">{sp.message}</div>}
      <form action={login} className="stack">
        <label><span className="label">Email address</span><input className="field" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label><span className="label">Password</span><input className="field" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required /></label>
        <button className="btn login-submit" type="submit"><span>Enter portal</span><span aria-hidden="true">↗</span></button>
      </form>
      <details className="signup-drawer"><summary>New cadet? <span>Create an account</span></summary>
        <form action={signup} className="stack" style={{marginTop:14}}>
          <div className="formgrid"><label><span className="label">First name</span><input className="field" name="first_name" autoComplete="given-name" required /></label><label><span className="label">Last name</span><input className="field" name="last_name" autoComplete="family-name" required /></label></div>
          <label><span className="label">Email</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
          <label><span className="label">Password</span><input className="field" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="btn secondary" type="submit">Create account</button>
        </form>
      </details>
    </div>
    </section>
  </main>
}
