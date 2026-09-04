-- Profiles store roles as checked text values. The previous trigger referenced
-- a removed enum type, causing every Auth signup to roll back.
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
      when new.raw_user_meta_data ->> 'staff_access_signature' = valid_staff_signature then 'staff'
      else 'cadet'
    end
  );

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
