CREATE OR REPLACE FUNCTION private.protect_profile_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION private.protect_profile_identity() FROM PUBLIC, anon, authenticated;
