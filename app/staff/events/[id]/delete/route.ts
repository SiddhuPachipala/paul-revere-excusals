import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase } = await requireStaff()

  // Don't allow deletion if cadets have already submitted
  // excusal requests for this event.
  const { count, error: countError } = await supabase
    .from('excusal_requests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  if (countError) {
    return new NextResponse(countError.message, { status: 400 })
  }

  if ((count || 0) > 0) {
    return new NextResponse(
      'This event has excusal requests and cannot be deleted. Close the event instead.',
      { status: 400 }
    )
  }

  // Safe to delete because no excusal requests exist.
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return new NextResponse(deleteError.message, { status: 400 })
  }

  return NextResponse.redirect(
    new URL('/staff', request.url),
    303
  )
}
