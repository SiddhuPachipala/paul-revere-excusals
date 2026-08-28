import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase } = await requireStaff()

  const formData = await request.formData()

  const startAt = String(formData.get('start_at') || '')
  const endAt = String(formData.get('end_at') || '')
  const deadline = String(formData.get('request_deadline') || '')

  const { error } = await supabase
    .from('events')
    .update({
      name: String(formData.get('name') || ''),
      event_type: String(formData.get('event_type') || '') || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      location: String(formData.get('location') || '') || null,
      company: String(formData.get('company') || 'ALL'),
      request_deadline: deadline
        ? new Date(deadline).toISOString()
        : null,
      makeup_instructions:
        String(formData.get('makeup_instructions') || '') || null,
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
