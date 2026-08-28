'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function changeUserRole(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify that the person making the change is actually an admin.
  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminError || adminProfile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const userId = String(formData.get('user_id') || '')
  const newRole = String(formData.get('role') || '')

  if (!userId) {
    throw new Error('Missing user ID')
  }

  if (!['cadet', 'staff'].includes(newRole)) {
    throw new Error('Invalid role')
  }

  // Prevent an admin from accidentally modifying their own role here.
  if (userId === user.id) {
    throw new Error('You cannot change your own role.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/staff/users')
  revalidatePath('/staff')
}
