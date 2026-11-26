create table public.client_intake (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  age smallint not null check (age between 18 and 120),
  barangay text not null check (char_length(btrim(barangay)) between 1 and 100),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  province text not null check (char_length(btrim(province)) between 1 and 100),
  documents text[] not null check (
    cardinality(documents) <= 12 and array_position(documents, null) is null and
    documents <@ array['birth-certificate','school-id','certificate-of-registration',
      'national-id','philsys-slip','postal-id','passport','student-permit','drivers-license',
      'barangay-residency','address-proof','other']::text[]
  )
);

alter table public.client_intake enable row level security;
revoke all on public.client_intake from anon, authenticated;
grant select, insert on public.client_intake to authenticated;
grant update (full_name, age, barangay, city, province, documents) on public.client_intake to authenticated;
grant select, insert, update on public.client_intake to service_role;

create policy "Clients can read their own intake"
on public.client_intake for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.profiles where user_id = (select auth.uid()) and role = 'client' and enabled
));

create policy "Clients can create their own intake"
on public.client_intake for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.profiles where user_id = (select auth.uid()) and role = 'client' and enabled
));

create policy "Clients can update their own intake"
on public.client_intake for update to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.profiles where user_id = (select auth.uid()) and role = 'client' and enabled
))
with check ((select auth.uid()) = user_id);

alter table public.consultation_requests add column client_intake_snapshot jsonb;
grant select (client_intake_snapshot) on public.consultation_requests to service_role;

create function public.attach_consultation_intake()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select to_jsonb(i) - 'user_id' into new.client_intake_snapshot
  from public.client_intake i where i.user_id = new.user_id;
  if new.client_intake_snapshot is null and auth.uid() is not null then
    raise check_violation using message = 'Complete the client questionnaire before submitting a consultation';
  end if;
  return new;
end;
$$;

revoke all on function public.attach_consultation_intake() from public, anon, authenticated;
create trigger first_id_consultation_intake before insert on public.consultation_requests
for each row execute function public.attach_consultation_intake();
