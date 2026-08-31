create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'sync-prb-google-calendar';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'sync-prb-google-calendar',
    '*/5 * * * *',
    $request$
      select net.http_post(
        url := 'https://xbelrlgwjfdsmvoqxpbf.supabase.co/functions/v1/sync-google-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-calendar-sync-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'calendar_sync_secret'
            order by created_at desc
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
    $request$
  );
end
$$;

