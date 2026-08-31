-- PostgREST upserts require a non-partial unique constraint/index. PostgreSQL
-- still permits multiple manual rows because null values are distinct.
drop index if exists public.events_google_occurrence_key;
create unique index events_google_occurrence_key
  on public.events (external_calendar_id, external_occurrence_id);

