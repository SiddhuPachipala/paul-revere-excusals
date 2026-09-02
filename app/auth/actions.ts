'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configuredUrl) return configuredUrl

  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')
  if (origin) return origin

  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http'
  if (host) return `${protocol}://${host}`

  return 'http://127.0.0.1:3000'
}

function getLoginErrorMessage(error: { code?: string; message?: string } | null) {
  const isUnverified = error?.code === 'email_not_confirmed'
    || error?.message?.toLowerCase().includes('email not confirmed')

  return isUnverified
    ? 'Your account has not been verified. Check your email for the verification link.'
    : 'Wrong email/password combination.'
}

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
  if (loginError) redirect(`/login?error=${encodeURIComponent(getLoginErrorMessage(loginError))}`)

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    await supabase.auth.signOut()
    redirect(`/login?error=${encodeURIComponent(getLoginErrorMessage(userError))}`)
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

  const requiredFields = { first_name, last_name, phone, company, ms_level, email, password }
  if (Object.values(requiredFields).some((value) => !value)) {
    redirect('/login?error=Complete%20every%20account%20field%20before%20continuing.')
  }
  if (!['A', 'B', 'C'].includes(company) || !['MS I', 'MS II', 'MS III', 'MS IV'].includes(ms_level)) {
    redirect('/login?error=Select%20a%20valid%20company%20and%20MS%20level.')
  }
  if (password.length < 8) redirect('/login?error=Password%20must%20be%20at%20least%208%20characters.')
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getSiteUrl()}/auth/confirm`,
      data: { first_name, last_name, phone, company, ms_level },
    },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/login?message=Account%20created.%20Check%20your%20email%20for%20the%20verification%20link.')
}

export async function resendVerification(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') || '').trim()

  if (!email) redirect('/login?error=Enter%20your%20email%20address%20to%20resend%20verification.')

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${await getSiteUrl()}/auth/confirm` },
  })

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/login?message=Verification%20email%20resent.%20Check%20your%20inbox%20and%20spam%20folder.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
