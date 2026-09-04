create table public.semester_pt_excusal_requests (
  id uuid primary key default gen_random_uuid(),
  cadet_id uuid not null references public.profiles(id) on delete cascade,
  semester text not null check (semester ~ '^(Spring|Fall) [0-9]{4}$'),
  reason text not null check (nullif(btrim(reason), '') is not null),
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  staff_notes text,
  submitted_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles(id),
  unique (cadet_id, semester)
);

alter table public.semester_pt_excusal_requests enable row level security;

create policy "Users can view accessible semester PT requests"
on public.semester_pt_excusal_requests for select to authenticated
using (cadet_id = (select auth.uid()) or private.is_staff());

create policy "Users can submit own semester PT requests"
on public.semester_pt_excusal_requests for insert to authenticated
with check (
  cadet_id = (select auth.uid())
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
      and nullif(btrim(p.first_name), '') is not null
      and nullif(btrim(p.last_name), '') is not null
      and nullif(btrim(p.email), '') is not null
      and nullif(btrim(p.phone), '') is not null
      and nullif(btrim(p.company), '') is not null
      and nullif(btrim(p.ms_level), '') is not null
      and nullif(btrim(p.ms_instructor), '') is not null
      and nullif(btrim(p.company_commander), '') is not null
      and nullif(btrim(p.position), '') is not null
  )
);

create policy "Staff can review semester PT requests"
on public.semester_pt_excusal_requests for update to authenticated
using (private.is_staff()) with check (private.is_staff());

create or replace function private.enforce_semester_pt_review()
returns trigger language plpgsql set search_path to '' as $$
begin
  if not private.is_staff() then raise exception 'Only staff can review this request'; end if;
  if old.status <> 'pending' or new.status not in ('approved', 'denied') then
    raise exception 'Only pending requests can be reviewed';
  end if;
  if new.id is distinct from old.id or new.cadet_id is distinct from old.cadet_id
    or new.semester is distinct from old.semester or new.reason is distinct from old.reason
    or new.submitted_at is distinct from old.submitted_at then
    raise exception 'Staff may only update review fields';
  end if;
  if new.reviewed_by is distinct from (select auth.uid()) or new.reviewed_at is null then
    raise exception 'Reviewer and review timestamp are required';
  end if;
  if new.reviewed_by = old.cadet_id then raise exception 'Users may not review their own requests'; end if;
  return new;
end;
$$;

create trigger enforce_semester_pt_review before update on public.semester_pt_excusal_requests
for each row execute function private.enforce_semester_pt_review();

revoke execute on function private.enforce_semester_pt_review() from public, anon, authenticated;
grant select, insert, update on public.semester_pt_excusal_requests to authenticated;
