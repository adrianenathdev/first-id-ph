alter table public.consultation_requests
  add column privacy_notice_version text,
  add column privacy_consented_at timestamptz,
  add constraint consultation_consent_fields_together check (
    (privacy_notice_version is null) = (privacy_consented_at is null)
  );

create function public.require_guest_privacy_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is null and (
    new.privacy_notice_version is null or btrim(new.privacy_notice_version) = ''
    or new.privacy_consented_at is null
  ) then
    raise check_violation using message = 'Consent is required for new guest consultations';
  end if;
  return new;
end;
$$;

revoke all on function public.require_guest_privacy_consent() from public, anon, authenticated;
create trigger first_id_guest_privacy_consent before insert on public.consultation_requests
for each row execute function public.require_guest_privacy_consent();
