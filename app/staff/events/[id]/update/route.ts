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
  const company = String(formData.get('company') || 'ALL')
  const startDate = new Date(startAt)
  const endDate = endAt ? new Date(endAt) : null
  const deadlineDate = deadline ? new Date(deadline) : null

  if (!String(formData.get('name') || '').trim() || Number.isNaN(startDate.getTime())) {
    return new NextResponse('Enter a valid event name and start time.', { status: 400 })
  }
  if ((endDate && Number.isNaN(endDate.getTime())) || (deadlineDate && Number.isNaN(deadlineDate.getTime()))) {
    return new NextResponse('Enter valid end and deadline times.', { status: 400 })
  }
  if (!['ALL', 'A', 'B', 'C'].includes(company)) {
    return new NextResponse('Select a valid company.', { status: 400 })
  }

  const { error } = await supabase
    .from('events')
    .update({
      name: String(formData.get('name') || '').trim(),
      event_type: String(formData.get('event_type') || '') || null,
      start_at: startDate.toISOString(),
      end_at: endDate ? endDate.toISOString() : null,
      location: String(formData.get('location') || '') || null,
      company,
      request_deadline: deadlineDate ? deadlineDate.toISOString() : null,
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
