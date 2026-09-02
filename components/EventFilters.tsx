type EventFiltersProps = {
  q: string
  sort: string
  status: string
  eventType: string
  company?: string
  showCompany?: boolean
}

export function EventFilters({ q, sort, status, eventType, company = 'all', showCompany = false }: EventFiltersProps) {
  return (
    <form method="get" className="event-filters">
      <label className="event-search"><span className="label">Search events</span><input className="field" type="search" name="q" defaultValue={q} placeholder="Name or location" /></label>
      <label><span className="label">Status</span><select className="field" name="status" defaultValue={status}><option value="all">All statuses</option><option value="active">Active</option><option value="closed">Closed</option></select></label>
      <label><span className="label">Event type</span><select className="field" name="type" defaultValue={eventType}><option value="all">All types</option><option value="Lab">Lab</option><option value="PT">PT</option><option value="FTX">FTX</option><option value="Class">Class</option><option value="Other">Other</option></select></label>
      {showCompany && <label><span className="label">Company</span><select className="field" name="company" defaultValue={company}><option value="all">All companies</option><option value="ALL">All Cadets</option><option value="A">A Company</option><option value="B">B Company</option><option value="C">C Company</option></select></label>}
      <label><span className="label">Sort</span><select className="field" name="sort" defaultValue={sort}><option value="date_asc">Date: earliest</option><option value="date_desc">Date: latest</option><option value="name_asc">Name: A–Z</option></select></label>
      <button className="btn secondary" type="submit">Apply</button>
      <a className="btn secondary" href={showCompany ? '/staff' : '/cadet'}>Clear</a>
    </form>
  )
}
