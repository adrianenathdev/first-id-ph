alter table public.consultation_requests
  alter column contact_email set not null,
  drop constraint consultation_contact_required,
  add constraint consultation_contact_required check (
    char_length(btrim(contact_email)) > 0 and (
      (contact_channel = 'email' and contact_profile is null)
      or (contact_channel in ('facebook', 'instagram') and contact_profile is not null)
    )
  );
