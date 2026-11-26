create table public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_email text not null default (auth.jwt() ->> 'email'),
  guide_slug text references public.id_guides(slug) on delete set null,
  preferred_day date,
  question text not null check (char_length(btrim(question)) between 1 and 800),
  status text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index consultation_requests_user_idx on public.consultation_requests (user_id, created_at desc);

alter table public.consultation_requests enable row level security;
revoke all on table public.consultation_requests from anon, authenticated;
grant select (id, guide_slug, preferred_day, status, created_at)
  on table public.consultation_requests to authenticated;
grant insert (guide_slug, preferred_day, question)
  on table public.consultation_requests to authenticated;

create policy "Users can read their own requests"
  on public.consultation_requests for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can submit their own requests"
  on public.consultation_requests for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (preferred_day is null or preferred_day >= (now() at time zone 'Asia/Manila')::date)
    and (guide_slug is null or exists (
      select 1 from public.id_guides where slug = guide_slug and published
    ))
  );
