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
  const first_name = String(formData.get('first_name') || '')
  const last_name = String(formData.get('last_name') || '')
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name } },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/login?message=Account%20created.%20Check%20your%20email%20if%20confirmation%20is%20required.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
