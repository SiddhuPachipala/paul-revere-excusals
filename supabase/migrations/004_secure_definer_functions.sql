-- Keep privileged helper functions out of the Data API's exposed public schema.
-- ALTER FUNCTION preserves the existing trigger and RLS policy dependencies.
create schema if not exists private;

-- Keep the database constraints aligned with the C Company options in the app.
alter table public.profiles drop constraint if exists profiles_company_check;
alter table public.profiles
  add constraint profiles_company_check
  check (company in ('A', 'B', 'C') or company is null);

alter table public.events drop constraint if exists events_company_check;
alter table public.events
  add constraint events_company_check
  check (company in ('A', 'B', 'C', 'ALL'));

alter function public.handle_new_user() set schema private;
alter function public.is_admin() set schema private;
alter function public.is_staff() set schema private;

-- Both authorization helpers fully qualify their referenced objects, so an
-- empty search path removes object-shadowing risk without changing behavior.
alter function private.is_admin() set search_path to '';
alter function private.is_staff() set search_path to '';

-- Trigger functions are invoked by PostgreSQL, never directly by API clients.
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- RLS policies may still evaluate these helpers for signed-in users, but they
-- are no longer addressable as public /rest/v1/rpc endpoints.
revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.is_staff() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;

-- A user must never be able to update their own role. Admins retain profile
-- update access through the separate is_admin()-guarded policy.
drop policy if exists "Users can update own profile" on public.profiles;

-- Cadets only see events assigned to everyone or to their own company. Staff
-- continue to see every event.
drop policy if exists "Authenticated users can view events" on public.events;
create policy "Users can view applicable events"
on public.events
for select
to authenticated
using (
  private.is_staff()
  or company = 'ALL'
  or company = (
    select p.company
    from public.profiles p
    where p.id = (select auth.uid())
  )
);

-- Enforce the same availability rules at the database boundary so a direct
-- API request cannot submit against a closed, past, expired, or unrelated event.
drop policy if exists "Cadets can submit own requests" on public.excusal_requests;
create policy "Cadets can submit applicable requests"
on public.excusal_requests
for insert
to authenticated
with check (
  cadet_id = (select auth.uid())
  and exists (
    select 1
    from public.events e
    join public.profiles p on p.id = (select auth.uid())
    where e.id = event_id
      and e.is_active
      and e.start_at > now()
      and (e.request_deadline is null or e.request_deadline >= now())
      and (e.company = 'ALL' or e.company = p.company)
  )
);

-- Replace broad generated grants with the smallest privileges used by the app.
revoke all on table public.profiles, public.events, public.excusal_requests, public.excusal_comments from anon;
revoke all on table public.profiles, public.events, public.excusal_requests, public.excusal_comments from authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.excusal_requests to authenticated;
grant select, insert on table public.excusal_comments to authenticated;

-- Make future functions opt-in instead of executable by API roles by default.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
