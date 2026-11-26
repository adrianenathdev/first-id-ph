create table public.id_guides (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  agency text not null,
  category text not null,
  summary text not null,
  bring text[] not null check (cardinality(bring) > 0),
  apply text not null check (apply ~ '^https://'),
  source text not null check (source ~ '^https://'),
  position integer not null default 0,
  published boolean not null default false,
  verified_on date
);

alter table public.id_guides enable row level security;
revoke all on table public.id_guides from anon, authenticated;
grant select on table public.id_guides to anon, authenticated;
create policy "Public may read published guides"
  on public.id_guides for select to anon, authenticated
  using (published);
