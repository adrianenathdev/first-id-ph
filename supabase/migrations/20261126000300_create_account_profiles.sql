create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'consultant', 'admin')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create function public.create_account_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_account_profile() from public, anon, authenticated;

create trigger first_id_account_profile
after insert on auth.users
for each row execute function public.create_account_profile();

insert into public.profiles (user_id) select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant select, update on table public.profiles to service_role;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Enabled accounts can access consultation requests"
on public.consultation_requests as restrictive
for all to authenticated
using (exists (
  select 1 from public.profiles
  where user_id = (select auth.uid()) and enabled
))
with check (exists (
  select 1 from public.profiles
  where user_id = (select auth.uid()) and enabled
));
