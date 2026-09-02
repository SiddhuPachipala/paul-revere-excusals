CREATE OR REPLACE FUNCTION private.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    company,
    ms_level
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'company',
    new.raw_user_meta_data ->> 'ms_level'
  );

  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."handle_new_user"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "private"."handle_new_user"() FROM PUBLIC;
