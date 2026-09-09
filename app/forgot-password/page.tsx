import Link from 'next/link'
import { requestPasswordReset } from '@/app/auth/actions'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams

  return <main className="loginwrap">
    <section className="login-intro" aria-labelledby="reset-request-title">
      <div className="login-mark" aria-hidden="true"><span>PR</span></div>
      <div className="login-kicker">Paul Revere Battalion · Account Recovery</div>
      <h1 id="reset-request-title">Recover your<br />access.</h1>
    </section>
    <section className="login" aria-label="Password recovery">
      <div className="login-card stack">
        <header className="login-card-head"><span className="login-index">02 / RECOVER</span><div><h2>Reset password</h2><p>We’ll email you a secure, one-time reset link.</p></div></header>
        {sp.error && <div className="notice login-error" role="alert" aria-live="polite">{sp.error}</div>}
        {sp.message && <div className="notice" role="status" aria-live="polite">{sp.message}</div>}
        <form action={requestPasswordReset} className="stack">
          <label><span className="label">Email address</span><input className="field" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <button className="btn login-submit" type="submit"><span>Send reset link</span><span aria-hidden="true">↗</span></button>
        </form>
        <Link className="login-back" href="/login">← Back to sign in</Link>
      </div>
    </section>
  </main>
}
