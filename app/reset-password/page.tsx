import { redirect } from 'next/navigation'
import { updatePassword } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/forgot-password?error=That%20reset%20link%20is%20invalid%20or%20has%20expired.')

  const sp = await searchParams
  return <main className="loginwrap">
    <section className="login-intro" aria-labelledby="new-password-title">
      <div className="login-mark" aria-hidden="true"><span>PR</span></div>
      <div className="login-kicker">Paul Revere Battalion · Account Recovery</div>
      <h1 id="new-password-title">Choose a new<br />password.</h1>
    </section>
    <section className="login" aria-label="Choose a new password">
      <div className="login-card stack">
        <header className="login-card-head"><span className="login-index">03 / SECURE</span><div><h2>New password</h2><p>Use at least eight characters.</p></div></header>
        {sp.error && <div className="notice login-error" role="alert" aria-live="polite">{sp.error}</div>}
        <form action={updatePassword} className="stack">
          <label><span className="label">New password</span><input className="field" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label><span className="label">Confirm new password</span><input className="field" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="btn login-submit" type="submit"><span>Update password</span><span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </section>
  </main>
}
