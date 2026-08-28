import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'

export default async function Home() {
  const { profile } = await getCurrentUserWithProfile()
  redirect(['staff','admin'].includes(profile.role) ? '/staff' : '/cadet')
}
