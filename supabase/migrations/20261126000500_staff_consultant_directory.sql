create function public.list_staff_consultants(pending_only boolean, page_offset integer)
returns table (user_id uuid, enabled boolean, email text, confirmed boolean, full_name text, nickname text)
language sql stable security definer
set search_path = ''
as $$
  select p.user_id, p.enabled, u.email::text, u.email_confirmed_at is not null,
    coalesce(u.raw_app_meta_data ->> 'staff_full_name', ''),
    coalesce(u.raw_app_meta_data ->> 'staff_nickname', '')
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.role = 'consultant'
    and (not pending_only or (p.enabled and u.email_confirmed_at is null))
  order by p.created_at desc, p.user_id
  offset greatest(page_offset, 0) limit 21
$$;

revoke all on function public.list_staff_consultants(boolean, integer) from public, anon, authenticated;
grant execute on function public.list_staff_consultants(boolean, integer) to service_role;
