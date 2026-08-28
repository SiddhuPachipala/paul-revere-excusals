import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'

export default async function StaffDashboard() {
  const { supabase } = await requireStaff()

  const { data: requests, error: requestsError } = await supabase
    .from('excusal_requests')
    .select(`
      id,
      status,
      submitted_at,
      profiles!excusal_requests_cadet_id_fkey(
        first_name,
        last_name,
        company
      ),
      events(
        name,
        start_at
      )
    `)
    .order('submitted_at', { ascending: false })

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: true })

  const pending = (requests || []).filter(
    (r) => r.status === 'pending'
  ).length

  return (
    <>
      <Nav staff />

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Staff Portal</div>
          <h1 className="h1">Excusal dashboard</h1>
          <p className="sub">
            Create events, review cadet requests, and manage battalion excusals.
          </p>
        </section>

        <div className="grid" style={{ marginBottom: 18 }}>
          <div className="card span6">
            <div className="eyebrow">Pending</div>
            <div className="stat">{pending}</div>
            <div className="muted">requests awaiting review</div>
          </div>

          <div className="card span6">
            <div className="eyebrow">Events</div>
            <div className="stat">{events?.length || 0}</div>
            <div className="muted">total events</div>
          </div>
        </div>

        {/* EVENTS */}
        <div className="card tablewrap" style={{ marginBottom: 18 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Events</h2>

            <Link className="btn" href="/staff/events/new">
              Create event
            </Link>
          </div>

          {eventsError && (
            <div className="notice">
              Error loading events: {eventsError.message}
            </div>
          )}

          {!events || events.length === 0 ? (
            <p className="muted">No events have been created.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <b>{event.name}</b>
                      <div className="small muted">
                        {event.event_type}
                      </div>
                    </td>

                    <td>{fmtDateTime(event.start_at)}</td>

                    <td>{event.location || '—'}</td>

                    <td>
                      {event.company === 'ALL'
                        ? 'All Cadets'
                        : `${event.company} Company`}
                    </td>

                    <td>
                      <span className="tag">
                        {event.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Link
                          className="btn secondary"
                          href={`/staff/events/${event.id}`}
                        >
                          Edit
                        </Link>

                        <form
                          action={`/staff/events/${event.id}/toggle`}
                          method="post"
                        >
                          <button
                            className="btn secondary"
                            type="submit"
                          >
                            {event.is_active ? 'Close' : 'Reopen'}
                          </button>
                        </form>

                        <form
                          action={`/staff/events/${event.id}/delete`}
                          method="post"
                        >
                          <button
                            className="btn danger"
                            type="submit"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* REQUESTS */}
        <div className="card tablewrap">
          <h2 style={{ marginTop: 0 }}>Recent requests</h2>

          {requestsError && (
            <div className="notice">
              Error loading requests: {requestsError.message}
            </div>
          )}

          {!requests || requests.length === 0 ? (
            <p className="muted">No excusal requests yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cadet</th>
                  <th>Event</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <b>
                        {r.profiles?.first_name}{' '}
                        {r.profiles?.last_name}
                      </b>

                      <div className="small muted">
                        {r.profiles?.company
                          ? `${r.profiles.company} Company`
                          : ''}
                      </div>
                    </td>

                    <td>
                      {r.events?.name}

                      <div className="small muted">
                        {r.events?.start_at &&
                          fmtDateTime(r.events.start_at)}
                      </div>
                    </td>

                    <td>{fmtDateTime(r.submitted_at)}</td>

                    <td>
                      <span className={`tag ${r.status}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="btn secondary"
                        href={`/staff/requests/${r.id}`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  )
}
