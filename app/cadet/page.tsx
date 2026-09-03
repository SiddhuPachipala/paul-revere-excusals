import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { currentTimestamp } from '@/lib/event-time'
import { EventFilters } from '@/components/EventFilters'
import { isProfileComplete } from '@/lib/profile'

export default async function CadetDashboard({ searchParams }: {
  searchParams: Promise<{ sort?: string; q?: string; status?: string; type?: string }>
}) {
  const sp = await searchParams
  const sort = ['date_asc', 'date_desc', 'name_asc'].includes(sp.sort || '')
    ? sp.sort as 'date_asc' | 'date_desc' | 'name_asc'
    : 'date_asc'
  const q = (sp.q || '').trim()
  const status = ['all', 'active', 'closed'].includes(sp.status || '') ? sp.status! : 'all'
  const eventType = ['all', 'Lab', 'PT', 'FTX', 'Class', 'Other'].includes(sp.type || '') ? sp.type! : 'all'
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const profileComplete = isProfileComplete(profile)
  const now = currentTimestamp()
  const companyFilter = profile.company
    ? `company.eq.ALL,company.eq.${profile.company}`
    : 'company.eq.ALL'

  // Show ALL events, newest/upcoming first
  let eventsQuery = supabase
    .from('events')
    .select('*')
    .or(companyFilter)

  eventsQuery = sort === 'name_asc'
    ? eventsQuery.order('name', { ascending: true }).order('start_at', { ascending: true })
    : eventsQuery.order('start_at', { ascending: sort === 'date_asc' })

  const { data: events, error: eventsError } = await eventsQuery
  const visibleEvents = (events || []).filter((event) => {
    const searchable = `${event.name} ${event.location || ''}`.toLowerCase()
    const deadlinePassed = event.request_deadline
      ? new Date(event.request_deadline).getTime() < now
      : false
    const closed = !event.is_active || new Date(event.start_at).getTime() <= now || deadlinePassed
    return (!q || searchable.includes(q.toLowerCase()))
      && (eventType === 'all' || event.event_type === eventType)
      && (status === 'all' || (status === 'closed' ? closed : !closed))
  })

  if (eventsError) {
    console.error('Error loading events:', eventsError)
  }

  const { data: requests } = await supabase
    .from('excusal_requests')
    .select('event_id,status')
    .eq('cadet_id', user.id)

  const requested = new Map(
    (requests || []).map((r) => [r.event_id, r.status])
  )

  return (
    <>
      <Nav staff={isStaff} admin={profile.role === 'admin'} />

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">{isStaff ? 'Personal Excusals' : 'Cadet Portal'}</div>
          <h1 className="h1">Battalion events</h1>
          <p className="sub">
            View applicable battalion events and request an excused absence when necessary.
          </p>
        </section>

        <div className="grid">
          <section className="card span8">
            <EventFilters q={q} sort={sort} status={status} eventType={eventType} />
            {eventsError && (
              <div className="notice">
                Could not load events: {eventsError.message}
              </div>
            )}

            {visibleEvents.length === 0 ? (
              <p className="muted">
                No events match your search and filters.
              </p>
            ) : (
              visibleEvents.map((e) => {
                const isPast = new Date(e.start_at).getTime() <= now
                const deadlinePassed = e.request_deadline
                  ? new Date(e.request_deadline).getTime() < now
                  : false
                const isClosed = !e.is_active || isPast || deadlinePassed

                return (
                  <div className="event" key={e.id}>
                    <div className="row">
                      <div>
                        <h3>{e.name}</h3>

                        <div className="muted small">
                          {fmtDateTime(e.start_at)}
                          {e.location ? ` · ${e.location}` : ''}
                        </div>

                        <div className="small muted">
                          Company: {e.company === 'ALL' ? 'All Cadets' : `${e.company} Company`}
                        </div>

                        {isClosed && (
                          <div className="small muted">Closed</div>
                        )}

                        {e.request_deadline && (
                          <div className="small muted">
                            Request deadline: {fmtDateTime(e.request_deadline)}
                          </div>
                        )}
                      </div>

                      <div>
                        {requested.has(e.id) ? (
                          <span className={`tag ${requested.get(e.id)}`}>
                            {String(requested.get(e.id)).replace('_', ' ')}
                          </span>
                        ) : !isClosed && profileComplete ? (
                          <Link
                            className="btn"
                            href={`/cadet/events/${e.id}`}
                          >
                            Request excusal
                          </Link>
                        ) : !isClosed ? (
                          <Link className="btn secondary" href="/cadet/profile">Complete profile</Link>
                        ) : (
                          <span className="tag">Unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </section>

          <aside className="card span4 stack">
            <div>
              <div className="eyebrow">Your profile</div>
              <h2 style={{ margin: '6px 0' }}>
                {profile.first_name} {profile.last_name}
              </h2>
            </div>

            <div className="small">
              <b>Company:</b> {profile.company || 'Not set'}
              <br />
              <b>MS level:</b> {profile.ms_level || 'Not set'}
              <br />
              <b>Position:</b> {profile.position || 'Not set'}
            </div>

            <div className="notice small">
              Your profile information is used when generating your excusal memorandum.
            </div>
            <div><Link className="btn secondary" href="/cadet/profile">Edit profile</Link></div>
          </aside>
        </div>
      </main>
    </>
  )
}
