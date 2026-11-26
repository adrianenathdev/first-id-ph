alter table public.consultation_requests
  alter column user_id drop not null,
  alter column contact_email drop not null,
  add column contact_channel text not null default 'email' check (contact_channel in ('email', 'facebook', 'instagram')),
  add column contact_profile text,
  add column tracking_code_hash text unique check (tracking_code_hash ~ '^[0-9a-f]{64}$'),
  add constraint guest_consultations_require_intake check (user_id is not null or (
    tracking_code_hash is not null and client_intake_snapshot is not null
  )),
  add constraint consultation_contact_required check (
    (contact_channel = 'email' and contact_email is not null and contact_profile is null)
    or (contact_channel in ('facebook', 'instagram') and contact_profile is not null and contact_email is null)
  );

create or replace function public.attach_consultation_intake()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is null then
    return new;
  end if;
  select to_jsonb(i) - 'user_id' into new.client_intake_snapshot
  from public.client_intake i where i.user_id = new.user_id;
  if new.client_intake_snapshot is null and auth.uid() is not null then
    raise check_violation using message = 'Complete the client questionnaire before submitting a consultation';
  end if;
  return new;
end;
$$;

grant insert on public.consultation_requests to service_role;

create table public.consultation_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  attempts integer not null default 0,
  primary key (bucket, window_start)
);
alter table public.consultation_rate_limits enable row level security;
revoke all on public.consultation_rate_limits from public, anon, authenticated;
create index consultation_rate_limits_window on public.consultation_rate_limits(window_start);

create function public.allow_consultation_request(action text, fingerprint text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  slot timestamptz := date_bin('15 minutes'::interval, now(), '2026-01-01T00:00:00Z'::timestamptz);
  request_limit integer;
  global_limit integer;
  hits integer;
begin
  if action = 'status' then request_limit := 25; global_limit := 1500;
  elsif action = 'submit' then request_limit := 5; global_limit := 300;
  else raise invalid_parameter_value;
  end if;
  if fingerprint is null or fingerprint !~ '^[0-9a-f]{64}$' then raise invalid_parameter_value; end if;

  insert into public.consultation_rate_limits as limits (bucket, window_start, attempts)
  values (action || ':' || fingerprint, slot, 1)
  on conflict (bucket, window_start)
  do update set attempts = limits.attempts + 1 where limits.attempts < request_limit
  returning attempts into hits;
  if not found then return false; end if;

  insert into public.consultation_rate_limits as limits (bucket, window_start, attempts)
  values (action || ':global', slot, 1)
  on conflict (bucket, window_start)
  do update set attempts = limits.attempts + 1 where limits.attempts < global_limit;
  if not found then return false; end if;

  delete from public.consultation_rate_limits where window_start < slot - '1 day'::interval;
  return true;
end;
$$;

revoke all on function public.allow_consultation_request(text,text) from public, anon, authenticated;
grant execute on function public.allow_consultation_request(text,text) to service_role;
