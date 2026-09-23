begin;
create function public.record_event(p_event jsonb) returns void language sql security invoker set search_path = public as $$
  insert into events(id,name,visitor,session,project,section,referrer,campaign,source,medium,device,browser,os,screen,returning_browser,country)
  values((p_event->>'id')::uuid,p_event->>'name',p_event->>'visitor',p_event->>'session',p_event->>'project',p_event->>'section',p_event->>'referrer',p_event->>'campaign',p_event->>'source',p_event->>'medium',p_event->>'device',p_event->>'browser',p_event->>'os',p_event->>'screen',(p_event->>'returning_browser')::boolean,p_event->>'country')
  on conflict(id) do nothing;
$$;
revoke execute on function public.record_event(jsonb) from public, anon, authenticated;
grant execute on function public.record_event(jsonb) to service_role;
commit;
