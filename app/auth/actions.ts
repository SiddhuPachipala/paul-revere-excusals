'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=Unable%20to%20load%20user')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
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
  if (!['A', 'B'].includes(company) || !['MS I', 'MS II', 'MS III', 'MS IV'].includes(ms_level)) {
    redirect('/login?error=Select%20a%20valid%20company%20and%20MS%20level.')
  }
  if (password.length < 8) redirect('/login?error=Password%20must%20be%20at%20least%208%20characters.')

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name, phone, company, ms_level } },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/login?message=Account%20created.%20Check%20your%20email%20if%20confirmation%20is%20required.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
