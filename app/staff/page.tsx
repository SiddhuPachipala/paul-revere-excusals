import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { requireStaff } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { currentTimestamp } from '@/lib/event-time'
import { oneRelation } from '@/lib/relation'
import { EventFilters } from '@/components/EventFilters'

export default async function StaffDashboard({ searchParams }: {
  searchParams: Promise<{ sort?: string; q?: string; status?: string; type?: string; company?: string }>
}) {
  const sp = await searchParams
  const sort = ['date_asc', 'date_desc', 'name_asc'].includes(sp.sort || '')
    ? sp.sort as 'date_asc' | 'date_desc' | 'name_asc'
    : 'date_asc'
  const q = (sp.q || '').trim()
  const status = ['all', 'active', 'closed'].includes(sp.status || '') ? sp.status! : 'all'
  const eventType = ['all', 'Lab', 'PT', 'FTX', 'Class', 'Other'].includes(sp.type || '') ? sp.type! : 'all'
  const company = ['all', 'ALL', 'A', 'B', 'C'].includes(sp.company || '') ? sp.company! : 'all'
  const { supabase, profile } = await requireStaff()
  const now = currentTimestamp()

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

  let eventsQuery = supabase
    .from('events')
    .select('*')

  eventsQuery = sort === 'name_asc'
    ? eventsQuery.order('name', { ascending: true }).order('start_at', { ascending: true })
    : eventsQuery.order('start_at', { ascending: sort === 'date_asc' })

  const { data: events, error: eventsError } = await eventsQuery
  const visibleEvents = (events || []).filter((event) => {
    const searchable = `${event.name} ${event.location || ''}`.toLowerCase()
    const closed = !event.is_active || new Date(event.start_at).getTime() <= now
    return (!q || searchable.includes(q.toLowerCase()))
      && (eventType === 'all' || event.event_type === eventType)
      && (company === 'all' || event.company === company)
      && (status === 'all' || (status === 'closed' ? closed : !closed))
  })

  const pending = (requests || []).filter(
    (r) => r.status === 'pending'
  ).length
  const requestRows = (requests || []).map((request) => ({
    ...request,
    profile: oneRelation(request.profiles),
    event: oneRelation(request.events),
  }))

  return (
    <>
      <Nav staff admin={profile.role === 'admin'} />

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

  <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
    {profile.role === 'admin' && (
      <Link className="btn secondary" href="/staff/users">
        Manage users
      </Link>
    )}

    <Link className="btn" href="/staff/events">
      Create event
    </Link>
  </div>
</div>

          <EventFilters q={q} sort={sort} status={status} eventType={eventType} company={company} showCompany />

          {eventsError && (
            <div className="notice">
              Error loading events: {eventsError.message}
            </div>
          )}

          {visibleEvents.length === 0 ? (
            <p className="muted">No events match your search and filters.</p>
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
                {visibleEvents.map((event) => {
                  const hasPassed = new Date(event.start_at).getTime() <= now
                  const isClosed = !event.is_active || hasPassed

                  return <tr key={event.id}>
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
                        {isClosed ? 'Closed' : 'Active'}
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

                        {hasPassed ? (
                          <button className="btn secondary" type="button" disabled>
                            Closed
                          </button>
                        ) : (
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
                        )}

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
                })}
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

          {requestRows.length === 0 ? (
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
                {requestRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>
                        {r.profile?.first_name}{' '}
                        {r.profile?.last_name}
                      </b>

                      <div className="small muted">
                        {r.profile?.company
                          ? `${r.profile.company} Company`
                          : ''}
                      </div>
                    </td>

                    <td>
                      {r.event?.name}

                      <div className="small muted">
                        {r.event?.start_at &&
                          fmtDateTime(r.event.start_at)}
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
