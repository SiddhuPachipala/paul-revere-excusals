CREATE OR REPLACE FUNCTION private.is_admin()
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
      and role = 'admin'
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_admin"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "private"."is_admin"() FROM PUBLIC;
