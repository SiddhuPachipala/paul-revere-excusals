import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { parseNewYorkLocal } from '@/lib/event-time'

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
  const eventType = String(formData.get('event_type') || '')
  const startDate = parseNewYorkLocal(startAt)
  const endDate = endAt ? parseNewYorkLocal(endAt) : null
  const deadlineDate = deadline ? parseNewYorkLocal(deadline) : null

  if (!String(formData.get('name') || '').trim() || !startDate) {
    return new NextResponse('Enter a valid event name and start time.', { status: 400 })
  }
  if ((endAt && !endDate) || (deadline && !deadlineDate)) {
    return new NextResponse('Enter valid end and deadline times.', { status: 400 })
  }
  if (!['ALL', 'A', 'B', 'C'].includes(company)) {
    return new NextResponse('Select a valid company.', { status: 400 })
  }
  if (!['Lab', 'PT', 'FTX', 'Class', 'Other'].includes(eventType)) {
    return new NextResponse('Select a valid event type.', { status: 400 })
  }
  if (endDate && endDate <= startDate) {
    return new NextResponse('The event end must be after its start.', { status: 400 })
  }
  if (deadlineDate && deadlineDate > startDate) {
    return new NextResponse('The excusal deadline cannot be after the event starts.', { status: 400 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      name: String(formData.get('name') || '').trim(),
      event_type: eventType,
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
    .select('id')
    .maybeSingle()

  if (error) {
    return new NextResponse(error.message, { status: 400 })
  }
  if (!data) return new NextResponse('Event not found', { status: 404 })

  return NextResponse.redirect(
    new URL('/staff', request.url),
    303
  )
}
