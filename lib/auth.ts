import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserWithProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('No profile found for this user.')
  return { supabase, user, profile }
}

export async function requireStaff() {
  const ctx = await getCurrentUserWithProfile()
  if (!['staff', 'admin'].includes(ctx.profile.role)) redirect('/cadet')
  return ctx
}
