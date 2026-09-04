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
    if old.status <> 'pending'
      or new.status not in ('approved', 'denied', 'changes_requested') then
      raise exception 'Only pending requests can be reviewed';
    end if;
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
    if new.reviewed_at is null then
      raise exception 'A review timestamp is required';
    end if;
    if new.reviewed_by = old.cadet_id then
      raise exception 'Users may not review their own excusal requests';
    end if;
    return new;
  end if;

  raise exception 'You are not authorized to update this excusal request';
end;
$$;

revoke execute on function private.enforce_excusal_update() from public, anon, authenticated;
