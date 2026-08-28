export function fmtDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/New_York'
  }).format(new Date(value))
}

export function fmtDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York'
  }).format(new Date(value))
}

export function armyDate(value: string) {
  const d = new Date(value)
  const day = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'America/New_York' }).format(d)
  const mon = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'America/New_York' }).format(d).toUpperCase()
  const yr = new Intl.DateTimeFormat('en-US', { year: '2-digit', timeZone: 'America/New_York' }).format(d)
  return `${day} ${mon} ${yr}`
}
