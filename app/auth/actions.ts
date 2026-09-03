'use server'

import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const LOGIN_ERROR = 'Wrong email/password combination.'
const STAFF_SIGNUP_PASSWORD = 'LIGHTYLANTY27'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  let loginError: { code?: string; message?: string } | null = null
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    loginError = error
  } catch (error) {
    loginError = error instanceof Error ? error : { message: 'Authentication failed' }
  }
  if (loginError) redirect(`/login?error=${encodeURIComponent(LOGIN_ERROR)}`)

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    await supabase.auth.signOut()
    redirect(`/login?error=${encodeURIComponent(LOGIN_ERROR)}`)
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profileError || !profile) {
    await supabase.auth.signOut()
    redirect('/login?error=Your%20account%20profile%20is%20not%20ready.%20Please%20contact%20an%20administrator.')
  }
  redirect(profile && ['staff', 'admin'].includes(profile.role) ? '/staff' : '/cadet')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const first_name = String(formData.get('first_name') || '').trim()
  const last_name = String(formData.get('last_name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const company = String(formData.get('company') || '').trim()
  const ms_level = String(formData.get('ms_level') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const staffSignup = formData.get('staff_signup') === 'on'
  const staffPassword = String(formData.get('staff_password') || '')

  const requiredFields = { first_name, last_name, phone, company, ms_level, email, password }
  if (Object.values(requiredFields).some((value) => !value)) {
    redirect('/login?error=Complete%20every%20account%20field%20before%20continuing.')
  }
  if (!['A', 'B', 'C'].includes(company) || !['MS I', 'MS II', 'MS III', 'MS IV'].includes(ms_level)) {
    redirect('/login?error=Select%20a%20valid%20company%20and%20MS%20level.')
  }
  if (password.length < 8) redirect('/login?error=Password%20must%20be%20at%20least%208%20characters.')
  if (staffSignup && staffPassword !== STAFF_SIGNUP_PASSWORD) {
    redirect('/login?error=The%20staff%20access%20password%20is%20incorrect.')
  }

  const staff_access_signature = staffSignup
    ? createHash('sha256').update(`staff:${email.toLowerCase()}:${STAFF_SIGNUP_PASSWORD}`).digest('hex')
    : null
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name, phone, company, ms_level, staff_access_signature } },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  if (data.session) redirect(staffSignup ? '/staff' : '/cadet')
  redirect('/login?message=Account%20created.%20You%20can%20sign%20in%20now.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
