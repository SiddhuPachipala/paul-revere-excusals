-- Track calendar-owned events without changing the behavior of manually created events.
alter table public.events
  add column source text not null default 'manual',
  add column external_calendar_id text,
  add column external_event_id text,
  add column external_occurrence_id text,
  add column external_updated_at timestamp with time zone;

alter table public.events
  add constraint events_source_check
  check (source in ('manual', 'google'));

create unique index events_google_occurrence_key
  on public.events (external_calendar_id, external_occurrence_id)
  where source = 'google';

comment on column public.events.source is
  'Whether the event was created in the portal or synchronized from Google Calendar.';
comment on column public.events.external_occurrence_id is
  'Stable per-occurrence key used to make repeated calendar synchronization idempotent.';

