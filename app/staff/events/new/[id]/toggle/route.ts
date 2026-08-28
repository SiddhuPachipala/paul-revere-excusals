import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase } = await requireStaff()

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('is_active')
    .eq('id', id)
    .single()

  if (fetchError || !event) {
    return new NextResponse('Event not found', { status: 404 })
  }

  const { error } = await supabase
    .from('events')
    .update({
      is_active: !event.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return new NextResponse(error.message, { status: 400 })
  }

  return NextResponse.redirect(
    new URL('/staff', request.url),
    303
  )
}
