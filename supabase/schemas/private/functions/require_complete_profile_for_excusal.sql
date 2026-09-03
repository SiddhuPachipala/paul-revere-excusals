CREATE OR REPLACE FUNCTION private.require_complete_profile_for_excusal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
begin
  if (tg_op = 'INSERT' or new.status = 'pending') and not exists (
    select 1
    from public.profiles p
    where p.id = new.cadet_id
      and nullif(pg_catalog.btrim(p.first_name), '') is not null
      and nullif(pg_catalog.btrim(p.last_name), '') is not null
      and nullif(pg_catalog.btrim(p.email), '') is not null
      and nullif(pg_catalog.btrim(p.phone), '') is not null
      and nullif(pg_catalog.btrim(p.company), '') is not null
      and nullif(pg_catalog.btrim(p.ms_level), '') is not null
      and nullif(pg_catalog.btrim(p.ms_instructor), '') is not null
      and nullif(pg_catalog.btrim(p.company_commander), '') is not null
      and nullif(pg_catalog.btrim(p.position), '') is not null
  ) then
    raise exception 'Complete every profile field before submitting an excusal';
  end if;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION private.require_complete_profile_for_excusal() FROM PUBLIC, anon, authenticated;
