import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { toNewYorkLocalInput } from '@/lib/event-time'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireStaff()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  return (
    <>
      <Nav staff />

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Staff Portal</div>
          <h1 className="h1">Edit event</h1>
        </section>

        <form
          className="card stack"
          action={`/staff/events/${id}/update`}
          method="post"
        >
          <label>
            Event name
            <input
              name="name"
              defaultValue={event.name}
              required
            />
          </label>

          <label>
            Event type
            <input
              name="event_type"
              defaultValue={event.event_type || ''}
            />
          </label>

          <label>
            Start
            <input
              type="datetime-local"
              name="start_at"
              defaultValue={toNewYorkLocalInput(event.start_at)}
              required
            />
          </label>

          <label>
            End
            <input
              type="datetime-local"
              name="end_at"
              defaultValue={toNewYorkLocalInput(event.end_at)}
            />
          </label>

          <label>
            Location
            <input
              name="location"
              defaultValue={event.location || ''}
            />
          </label>

          <label>
            Company
            <select name="company" defaultValue={event.company}>
              <option value="ALL">All Cadets</option>
              <option value="A">A Company</option>
              <option value="B">B Company</option>
              <option value="C">C Company</option>
            </select>
          </label>

          <label>
            Excusal deadline
            <input
              type="datetime-local"
              name="request_deadline"
              defaultValue={toNewYorkLocalInput(event.request_deadline)}
            />
          </label>

          <label>
            Default makeup instructions
            <textarea
              name="makeup_instructions"
              defaultValue={event.makeup_instructions || ''}
            />
          </label>

          <button className="btn" type="submit">
            Save changes
          </button>
        </form>
      </main>
    </>
  )
}
