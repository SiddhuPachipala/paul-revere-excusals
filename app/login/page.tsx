import { login, signup } from '@/app/auth/actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const sp = await searchParams
  return <main className="loginwrap">
    <section className="login-intro" aria-labelledby="login-title">
      <div className="login-mark" aria-hidden="true"><span>PR</span></div>
      <div className="login-kicker">Paul Revere Battalion · Excusal Ledger</div>
      <h1 id="login-title">Every absence<br />leaves a mark.</h1>
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
            <div className="formgrid">
              <label><span className="label">Company</span><select className="field" name="company" defaultValue="" required><option value="" disabled>Select company</option><option value="A">A Company</option><option value="B">B Company</option><option value="C">C Company</option></select></label>
              <label><span className="label">MS level</span><select className="field" name="ms_level" defaultValue="" required><option value="" disabled>Select level</option><option value="MS I">MS I</option><option value="MS II">MS II</option><option value="MS III">MS III</option><option value="MS IV">MS IV</option></select></label>
            </div>
            <label><span className="label">Phone number</span><input className="field" name="phone" type="tel" autoComplete="tel" placeholder="(555) 555-5555" required /></label>
            <label><span className="label">Email</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
            <label><span className="label">Password</span><input className="field" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <label><span className="label">Staff access password <span className="optional-label">Optional</span></span><input className="field" name="staff_password" type="password" autoComplete="off" placeholder="Leave blank for a cadet account" /></label>
          <button className="btn secondary" type="submit">Create account</button>
        </form>
      </details>
    </div>
    </section>
  </main>
}
