const TIME_ZONE = 'America/New_York'

type DateParts = { year: number; month: number; day: number; hour: number; minute: number }

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

function partsAt(date: Date): DateParts & { second: number } {
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  )
  return parts as DateParts & { second: number }
}

function offsetAt(timestamp: number) {
  const p = partsAt(new Date(timestamp))
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - timestamp
}

export function parseNewYorkLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const desired: DateParts = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4]), minute: Number(match[5]),
  }
  const wallTime = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute)
  let timestamp = wallTime - offsetAt(wallTime)
  timestamp = wallTime - offsetAt(timestamp)
  const parsed = new Date(timestamp)
  const actual = partsAt(parsed)

  if (Object.entries(desired).some(([key, part]) => actual[key as keyof DateParts] !== part)) return null
  return parsed
}

export function toNewYorkLocalInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const p = partsAt(date)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

export function currentTimestamp() {
  return Date.now()
}
