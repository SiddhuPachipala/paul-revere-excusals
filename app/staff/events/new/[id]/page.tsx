import { notFound } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'

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

  const toLocalInput = (value: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

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
              defaultValue={toLocalInput(event.start_at)}
              required
            />
          </label>

          <label>
            End
            <input
              type="datetime-local"
              name="end_at"
              defaultValue={toLocalInput(event.end_at)}
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
            </select>
          </label>

          <label>
            Excusal deadline
            <input
              type="datetime-local"
              name="request_deadline"
              defaultValue={toLocalInput(event.request_deadline)}
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
