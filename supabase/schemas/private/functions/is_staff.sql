CREATE OR REPLACE FUNCTION private.is_staff()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('staff', 'admin')
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_staff"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "private"."is_staff"() FROM PUBLIC;
