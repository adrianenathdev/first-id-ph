create schema if not exists vault;
create schema if not exists extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists pgcrypto with schema extensions;

create function public.initialize_consultation_tracking_key(existing_key text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if existing_key is null or length(existing_key) < 32 then
    raise invalid_parameter_value using message = 'A tracking key of at least 32 characters is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('first-id-ph-consultation-tracking', 0));
  if exists (select 1 from vault.secrets where name = 'first_id_consultation_tracking') then
    return false;
  end if;

  perform vault.create_secret(existing_key, 'first_id_consultation_tracking', 'First ID PH guest tracking HMAC');
  return true;
end;
$$;

revoke all on function public.initialize_consultation_tracking_key(text) from public, anon, authenticated;
grant execute on function public.initialize_consultation_tracking_key(text) to service_role;

-- Keep environments with issued codes on their existing key. New environments initialize automatically.
do $$
begin
  if not exists (select 1 from public.consultation_requests where tracking_code_hash is not null) then
    perform public.initialize_consultation_tracking_key(encode(extensions.gen_random_bytes(32), 'hex'));
  end if;
end;
$$;

create function public.hash_consultation_value(purpose text, input_value text)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare
  tracking_key text;
begin
  if purpose not in ('network', 'tracking') or purpose is null or input_value is null or length(input_value) > 4096 then
    raise invalid_parameter_value using message = 'Invalid tracking hash input';
  end if;

  select decrypted_secret into tracking_key
  from vault.decrypted_secrets where name = 'first_id_consultation_tracking';

  if tracking_key is null then
    raise object_not_in_prerequisite_state using message = 'Consultation tracking key is not initialized';
  end if;

  return encode(extensions.hmac(convert_to(purpose || ':' || input_value, 'UTF8'), convert_to(tracking_key, 'UTF8'), 'sha256'), 'hex');
end;
$$;

revoke all on function public.hash_consultation_value(text,text) from public, anon, authenticated;
grant execute on function public.hash_consultation_value(text,text) to service_role;
