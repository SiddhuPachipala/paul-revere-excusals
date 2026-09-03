create policy "Users can update own profile information"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function private.protect_profile_identity()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.id is distinct from old.id
    or new.created_at is distinct from old.created_at then
    raise exception 'Profile identity cannot be changed';
  end if;
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only administrators can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_identity on public.profiles;
create trigger protect_profile_identity
before update on public.profiles
for each row execute function private.protect_profile_identity();

revoke execute on function private.protect_profile_identity() from public, anon, authenticated;

create or replace function private.require_complete_profile_for_excusal()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if (tg_op = 'INSERT' or new.status = 'pending') and not exists (
    select 1
    from public.profiles p
    where p.id = new.cadet_id
      and nullif(pg_catalog.btrim(p.first_name), '') is not null
      and nullif(pg_catalog.btrim(p.last_name), '') is not null
      and nullif(pg_catalog.btrim(p.email), '') is not null
      and nullif(pg_catalog.btrim(p.phone), '') is not null
      and nullif(pg_catalog.btrim(p.company), '') is not null
      and nullif(pg_catalog.btrim(p.ms_level), '') is not null
      and nullif(pg_catalog.btrim(p.ms_instructor), '') is not null
      and nullif(pg_catalog.btrim(p.company_commander), '') is not null
      and nullif(pg_catalog.btrim(p.position), '') is not null
  ) then
    raise exception 'Complete every profile field before submitting an excusal';
  end if;
  return new;
end;
$$;

drop trigger if exists require_complete_profile_for_excusal on public.excusal_requests;
create trigger require_complete_profile_for_excusal
before insert or update on public.excusal_requests
for each row execute function private.require_complete_profile_for_excusal();

revoke execute on function private.require_complete_profile_for_excusal() from public, anon, authenticated;

drop policy if exists "Cadets can submit applicable requests" on public.excusal_requests;
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
      and nullif(pg_catalog.btrim(p.first_name), '') is not null
      and nullif(pg_catalog.btrim(p.last_name), '') is not null
      and nullif(pg_catalog.btrim(p.email), '') is not null
      and nullif(pg_catalog.btrim(p.phone), '') is not null
      and nullif(pg_catalog.btrim(p.company), '') is not null
      and nullif(pg_catalog.btrim(p.ms_level), '') is not null
      and nullif(pg_catalog.btrim(p.ms_instructor), '') is not null
      and nullif(pg_catalog.btrim(p.company_commander), '') is not null
      and nullif(pg_catalog.btrim(p.position), '') is not null
  )
);
