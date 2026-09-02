CREATE OR REPLACE FUNCTION private.enforce_excusal_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION private.enforce_excusal_update() FROM PUBLIC, anon, authenticated;
