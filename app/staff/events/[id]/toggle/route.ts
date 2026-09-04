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
    .select('is_active,start_at,manually_closed')
    .eq('id', id)
    .single()

  if (fetchError || !event) {
    return new NextResponse('Event not found', { status: 404 })
  }

  if (!event.is_active && new Date(event.start_at).getTime() <= Date.now()) {
    return new NextResponse('Past events cannot be reopened', { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('events')
    .update({
      is_active: !event.is_active,
      manually_closed: event.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    return new NextResponse(error.message, { status: 400 })
  }
  if (!updated) return new NextResponse('Event not found', { status: 404 })

  return NextResponse.redirect(
    new URL('/staff', request.url),
    303
  )
}
