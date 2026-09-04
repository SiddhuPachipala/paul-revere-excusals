CREATE OR REPLACE FUNCTION private.enforce_semester_pt_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION private.enforce_semester_pt_review() FROM PUBLIC, anon, authenticated;
