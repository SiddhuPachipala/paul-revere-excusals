-- Google occasionally rate-limits Edge Function egress. The database HTTP
-- extension provides a second, synchronous network path for the same public feed.
create extension if not exists http with schema extensions;

create or replace function public.fetch_google_calendar_ics()
returns text
language sql
security definer
set search_path to ''
as $$
  select (extensions.http_get(
    'https://calendar.google.com/calendar/ical/prb.arotc%40gmail.com/public/basic.ics'
  )).content;
$$;

revoke execute on function public.fetch_google_calendar_ics() from public, anon, authenticated;
grant execute on function public.fetch_google_calendar_ics() to service_role;

