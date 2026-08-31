create extension if not exists pgcrypto with schema extensions;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  valid_staff_signature text;
begin
  valid_staff_signature := encode(
    digest('staff:' || lower(new.email) || ':LIGHTYLANTY27', 'sha256'),
    'hex'
  );

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

  if new.raw_user_meta_data ->> 'staff_access_signature' = valid_staff_signature then
    update public.profiles set role = 'staff' where id = new.id;
  end if;

  return new;
end;
$$;
