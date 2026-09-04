CREATE OR REPLACE FUNCTION private.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
    id,
    email,
    first_name,
    last_name,
    phone,
    company,
    ms_level,
    role
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'company',
    new.raw_user_meta_data ->> 'ms_level',
    case
      when new.raw_user_meta_data ->> 'staff_access_signature' = valid_staff_signature then 'staff'
      else 'cadet'
    end
  );

  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."handle_new_user"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "private"."handle_new_user"() FROM PUBLIC;
