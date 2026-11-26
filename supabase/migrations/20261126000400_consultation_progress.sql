alter table public.consultation_requests
  drop constraint consultation_requests_status_check,
  add constraint consultation_requests_status_check
    check (status in ('requested', 'claimed', 'contacted', 'scheduled', 'completed', 'cancelled')),
  add column assigned_consultant_id uuid references public.profiles(user_id),
  add column claimed_at timestamptz,
  add column contacted_at timestamptz,
  add column meeting_at timestamptz,
  add column closed_at timestamptz;

create index consultation_requests_staff_queue
  on public.consultation_requests (status, created_at desc);
create index consultation_requests_assignee
  on public.consultation_requests (assigned_consultant_id, created_at desc);

grant select (claimed_at, contacted_at, meeting_at, closed_at)
  on public.consultation_requests to authenticated;
grant select on public.consultation_requests to service_role;

create function public.advance_consultation(
  ticket_id uuid,
  action text,
  meeting_time timestamptz default null
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  consultant_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.profiles
    where user_id = consultant_id and enabled and role = 'consultant'
  ) or not coalesce(auth.jwt()->'amr' @> '[{"method":"password"}]'::jsonb, false) then
    raise insufficient_privilege using message = 'Consultant password sign-in required';
  end if;

  case action
    when 'claim' then
      update public.consultation_requests
      set status = 'claimed', assigned_consultant_id = consultant_id, claimed_at = now()
      where id = ticket_id and status = 'requested' and assigned_consultant_id is null;
    when 'contact' then
      update public.consultation_requests
      set status = 'contacted', contacted_at = now()
      where id = ticket_id and status = 'claimed' and assigned_consultant_id = consultant_id;
    when 'schedule' then
      if meeting_time is null or meeting_time <= now() then
        raise invalid_parameter_value using message = 'Select a future meeting time';
      end if;
      update public.consultation_requests
      set status = 'scheduled', meeting_at = meeting_time
      where id = ticket_id and status = 'contacted' and assigned_consultant_id = consultant_id;
    when 'close' then
      update public.consultation_requests
      set status = 'completed', closed_at = now()
      where id = ticket_id and status = 'scheduled' and assigned_consultant_id = consultant_id;
    else
      raise invalid_parameter_value using message = 'Unknown consultation action';
  end case;
  return found;
end;
$$;

revoke all on function public.advance_consultation(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.advance_consultation(uuid, text, timestamptz) to authenticated;
