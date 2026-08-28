'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function changeUserRole(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: currentProfile, error: profileError } =
    await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

  if (profileError) {
    throw new Error(
      `Could not verify admin status: ${profileError.message}`
    )
  }

  if (currentProfile?.role !== 'admin') {
    throw new Error(
      'You are not authorized to manage users.'
    )
  }

  const targetUserId = String(
    formData.get('user_id') || ''
  )

  const newRole = String(
    formData.get('role') || ''
  )

  if (!targetUserId) {
    throw new Error('Missing target user ID.')
  }

  if (!['cadet', 'staff'].includes(newRole)) {
    throw new Error('Invalid role.')
  }

  if (targetUserId === user.id) {
    throw new Error(
      'You cannot change your own role.'
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .select('id, role')
    .single()

  if (error) {
    throw new Error(
      `Could not change role: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'No profile was updated. Check your Supabase RLS policies.'
    )
  }

  revalidatePath('/staff/users')
  revalidatePath('/staff')
}
