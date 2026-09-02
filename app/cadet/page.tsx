import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { fmtDateTime } from '@/lib/format'
import { currentTimestamp } from '@/lib/event-time'

export default async function CadetDashboard() {
  const { supabase, user, profile } = await getCurrentUserWithProfile()
  const isStaff = ['staff', 'admin'].includes(profile.role)
  const now = currentTimestamp()
  const companyFilter = profile.company
    ? `company.eq.ALL,company.eq.${profile.company}`
    : 'company.eq.ALL'

  // Show ALL events, newest/upcoming first
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .or(companyFilter)
    .order('start_at', { ascending: true })

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
            {eventsError && (
              <div className="notice">
                Could not load events: {eventsError.message}
              </div>
            )}

            {!events || events.length === 0 ? (
              <p className="muted">
                No events have been created yet.
              </p>
            ) : (
              events.map((e) => {
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
                        ) : !isClosed ? (
                          <Link
                            className="btn"
                            href={`/cadet/events/${e.id}`}
                          >
                            Request excusal
                          </Link>
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
          </aside>
        </div>
      </main>
    </>
  )
}
