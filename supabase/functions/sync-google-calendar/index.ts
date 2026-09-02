import ICAL from "npm:ical.js@2.2.1";
import { createClient } from "npm:@supabase/supabase-js@2";

const CALENDAR_ID = "prb.arotc@gmail.com";
const CALENDAR_URL =
  "https://calendar.google.com/calendar/ical/prb.arotc%40gmail.com/public/basic.ics";
const FUTURE_WINDOW_DAYS = 180;
const PAST_WINDOW_DAYS = 7;
const MAX_OCCURRENCES_PER_SERIES = 2_000;

async function fetchCalendarFromGoogle(): Promise<string> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(CALENDAR_URL, {
      headers: {
        accept: "text/calendar",
        "user-agent": "Paul-Revere-Battalion-Calendar-Sync/1.0",
      },
    });
    if (response.ok) return response.text();

    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) break;
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1_000, 15_000)
      : 1_000 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw new Error(`Google Calendar returned ${lastStatus}`);
}

async function fetchCalendar(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data, error } = await supabase.rpc("fetch_google_calendar_ics");
  if (!error && typeof data === "string" && data.includes("BEGIN:VCALENDAR")) {
    return data;
  }

  try {
    return await fetchCalendarFromGoogle();
  } catch (directError) {
    console.warn("Direct calendar fetch also failed", directError);
    throw new Error(`Calendar feed unavailable: ${error?.message ?? "invalid database response"}`);
  }
}

type CalendarRow = {
  name: string;
  event_type: "Lab" | "PT" | "FTX" | "Class" | "Other";
  start_at: string;
  end_at: string | null;
  location: string | null;
  company: "A" | "B" | "C" | "ALL";
  makeup_instructions: string | null;
  source: "google";
  external_calendar_id: string;
  external_event_id: string;
  external_occurrence_id: string;
  external_updated_at: string | null;
  updated_at: string;
};

function eventType(summary: string): CalendarRow["event_type"] {
  const title = summary.toUpperCase();
  if (/\b(FTX|STX)\b/.test(title)) return "FTX";
  if (/\b(PT|AFT|ACFT)\b/.test(title)) return "PT";
  if (/\b(LLAB|LAB)\b/.test(title)) return "Lab";
  if (/\b(CLASS|LECTURE)\b/.test(title)) return "Class";
  return "Other";
}

function companyFor(summary: string, description: string): CalendarRow["company"] {
  const text = `${summary}\n${description}`;
  const match = text.match(
    /(?:\[|\b)([ABC])\s*(?:COMPANY|CO\.?)(?:\]|\b)|\b(?:COMPANY|CO\.?)\s*[:\-]?\s*([ABC])\b/i,
  );
  return (match?.[1] ?? match?.[2] ?? "ALL").toUpperCase() as CalendarRow["company"];
}

function makeupGuidance(description: string): string | null {
  const match = description.match(/(?:^|\n)\s*makeup guidance\s*:\s*([^\n]+)/i);
  return match?.[1]?.trim() || null;
}

function iso(value: ICAL.Time | null | undefined): string | null {
  return value ? value.toJSDate().toISOString() : null;
}

function rowFor(event: ICAL.Event, start: ICAL.Time, end: ICAL.Time | null): CalendarRow | null {
  const component = event.component;
  const status = String(component.getFirstPropertyValue("status") ?? "").toUpperCase();
  if (status === "CANCELLED") return null;

  const summary = String(component.getFirstPropertyValue("summary") ?? "").trim();
  const uid = String(component.getFirstPropertyValue("uid") ?? "").trim();
  const startAt = iso(start);
  if (!summary || !uid || !startAt) return null;

  const description = String(component.getFirstPropertyValue("description") ?? "");
  const updated = component.getFirstPropertyValue("last-modified") as ICAL.Time | null;
  const stamp = component.getFirstPropertyValue("dtstamp") as ICAL.Time | null;

  return {
    name: summary,
    event_type: eventType(summary),
    start_at: startAt,
    end_at: iso(end),
    location: String(component.getFirstPropertyValue("location") ?? "").trim() || null,
    company: companyFor(summary, description),
    makeup_instructions: makeupGuidance(description),
    source: "google",
    external_calendar_id: CALENDAR_ID,
    external_event_id: uid,
    external_occurrence_id: `${uid}:${startAt}`,
    external_updated_at: iso(updated) ?? iso(stamp),
    updated_at: new Date().toISOString(),
  };
}

function calendarRows(ics: string): CalendarRow[] {
  const root = new ICAL.Component(ICAL.parse(ics));
  const components = root.getAllSubcomponents("vevent");
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];

  for (const component of components) {
    const event = new ICAL.Event(component);
    if (!event.uid) continue;
    if (event.isRecurrenceException()) exceptions.push(event);
    else masters.set(event.uid, event);
  }

  for (const exception of exceptions) {
    masters.get(exception.uid)?.relateException(exception);
  }

  const now = Date.now();
  const windowStart = now - PAST_WINDOW_DAYS * 86_400_000;
  const windowEnd = now + FUTURE_WINDOW_DAYS * 86_400_000;
  const rows = new Map<string, CalendarRow>();

  for (const event of masters.values()) {
    const masterStatus = String(event.component.getFirstPropertyValue("status") ?? "").toUpperCase();
    if (masterStatus === "CANCELLED") continue;

    if (!event.isRecurring()) {
      const startMs = event.startDate.toJSDate().getTime();
      if (startMs >= windowStart && startMs <= windowEnd) {
        const row = rowFor(event, event.startDate, event.endDate);
        if (row) rows.set(row.external_occurrence_id, row);
      }
      continue;
    }

    const iterator = event.iterator();
    for (let count = 0; count < MAX_OCCURRENCES_PER_SERIES; count++) {
      const occurrence = iterator.next();
      if (!occurrence) break;
      const occurrenceMs = occurrence.toJSDate().getTime();
      if (occurrenceMs > windowEnd) break;
      if (occurrenceMs < windowStart) continue;

      const details = event.getOccurrenceDetails(occurrence);
      const row = rowFor(details.item, details.startDate, details.endDate);
      if (row) rows.set(row.external_occurrence_id, row);
    }
  }

  return [...rows.values()];
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expectedSecret = Deno.env.get("CALENDAR_SYNC_SECRET");
  if (!expectedSecret || request.headers.get("x-calendar-sync-secret") !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const rows = calendarRows(await fetchCalendar(supabase));

    for (let offset = 0; offset < rows.length; offset += 250) {
      const { error } = await supabase.from("events").upsert(rows.slice(offset, offset + 250), {
        onConflict: "external_calendar_id,external_occurrence_id",
      });
      if (error) throw error;
    }

    const currentOccurrenceIds = rows.map((row) => row.external_occurrence_id);
    for (let offset = 0; offset < currentOccurrenceIds.length; offset += 250) {
      const { error } = await supabase
        .from("events")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("source", "google")
        .eq("manually_closed", false)
        .gt("start_at", new Date().toISOString())
        .in("external_occurrence_id", currentOccurrenceIds.slice(offset, offset + 250));
      if (error) throw error;
    }

    const now = Date.now();
    const windowStart = new Date(now - PAST_WINDOW_DAYS * 86_400_000).toISOString();
    const windowEnd = new Date(now + FUTURE_WINDOW_DAYS * 86_400_000).toISOString();
    const { data: storedRows, error: storedError } = await supabase
      .from("events")
      .select("id,external_occurrence_id")
      .eq("source", "google")
      .gte("start_at", windowStart)
      .lte("start_at", windowEnd);
    if (storedError) throw storedError;

    const currentOccurrences = new Set(currentOccurrenceIds);
    const staleIds = (storedRows ?? [])
      .filter((row) => !row.external_occurrence_id || !currentOccurrences.has(row.external_occurrence_id))
      .map((row) => row.id);
    for (let offset = 0; offset < staleIds.length; offset += 250) {
      const { error } = await supabase
        .from("events")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", staleIds.slice(offset, offset + 250));
      if (error) throw error;
    }

    const { error: closePastError } = await supabase
      .from("events")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("source", "google")
      .lte("start_at", new Date().toISOString())
      .eq("is_active", true);
    if (closePastError) throw closePastError;

    return Response.json({ ok: true, synchronized: rows.length, closed: staleIds.length });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "Calendar sync failed";
    return Response.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
});
