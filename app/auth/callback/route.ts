import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL('/reset-password', request.url))
  }

  return NextResponse.redirect(
    new URL('/forgot-password?error=That%20reset%20link%20is%20invalid%20or%20has%20expired.', request.url)
  )
}
