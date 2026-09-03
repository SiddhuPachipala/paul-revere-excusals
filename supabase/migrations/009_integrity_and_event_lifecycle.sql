create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  valid_staff_signature text;
begin
  valid_staff_signature := pg_catalog.encode(
    extensions.digest(
      'staff:' || pg_catalog.lower(new.email) || ':LIGHTYLANTY27',
      'sha256'
    ),
    'hex'
  );

  insert into public.profiles (
    id, email, first_name, last_name, phone, company, ms_level, role
  ) values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'company',
    new.raw_user_meta_data ->> 'ms_level',
    case
      when new.raw_user_meta_data ->> 'staff_access_signature' = valid_staff_signature then 'staff'::public.user_role
      else 'cadet'::public.user_role
    end
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- Distinguish a deliberate staff closure from a temporary calendar absence.
alter table public.events
  add column if not exists manually_closed boolean not null default false;

-- Owners may revise only requests explicitly returned for changes. A trigger
-- constrains which fields each role can modify and prevents self-review.
drop policy if exists "Staff can update requests" on public.excusal_requests;
create policy "Staff can review requests"
on public.excusal_requests
for update
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "Owners can resubmit requested changes"
on public.excusal_requests
for update
to authenticated
using (cadet_id = (select auth.uid()) and status = 'changes_requested')
with check (cadet_id = (select auth.uid()) and status = 'pending');

create or replace function private.enforce_excusal_update()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if old.cadet_id = (select auth.uid()) and old.status = 'changes_requested' then
    if new.status <> 'pending'
      or new.cadet_id is distinct from old.cadet_id
      or new.event_id is distinct from old.event_id
      or new.staff_notes is distinct from old.staff_notes
      or new.submitted_at is distinct from old.submitted_at
      or new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by
      or new.memo_snapshot is distinct from old.memo_snapshot then
      raise exception 'Only the reason and makeup plan may be revised';
    end if;

    return new;
  end if;

  if private.is_staff() then
    if new.cadet_id is distinct from old.cadet_id
      or new.event_id is distinct from old.event_id
      or new.reason is distinct from old.reason
      or new.makeup_plan is distinct from old.makeup_plan
      or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Staff may only update review fields';
    end if;

    if new.reviewed_by is distinct from (select auth.uid()) then
      raise exception 'Reviewer must be the current user';
    end if;

    if new.reviewed_by = old.cadet_id then
      raise exception 'Users may not review their own excusal requests';
    end if;

    return new;
  end if;

  raise exception 'You are not authorized to update this excusal request';
end;
$$;

drop trigger if exists enforce_excusal_update on public.excusal_requests;
create trigger enforce_excusal_update
before update on public.excusal_requests
for each row execute function private.enforce_excusal_update();

revoke execute on function private.enforce_excusal_update() from public, anon, authenticated;

-- Close elapsed events in storage as well as in the UI.
update public.events
set is_active = false, updated_at = now()
where is_active and start_at <= now();

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'close-past-prb-events';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'close-past-prb-events',
    '* * * * *',
    $job$
      update public.events
      set is_active = false, updated_at = now()
      where is_active and start_at <= now();
    $job$
  );
end
$$;
