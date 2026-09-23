begin;
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  name text not null check (length(name) between 1 and 100),
  email text not null check (length(email) <= 254),
  company text not null default '' check (length(company) <= 160),
  contact_type text not null check (contact_type in ('Job opportunity','Freelance project','Collaboration','Research','Robotics','Embedded Systems','Software Architecture','Other')),
  message text not null default '' check (length(message) <= 5000),
  budget text not null default '' check (length(budget) <= 100),
  timeline text not null default '' check (length(timeline) <= 100),
  source_page text not null default '/' check (source_page in ('/')),
  status text not null default 'NEW' check (status in ('NEW','READ','REPLIED','ARCHIVED')),
  created_at timestamptz not null default now()
);
create index signals_created on public.signals(created_at desc, id);
create index signals_status on public.signals(status, created_at desc);
create table public.owner_sessions (
  token_hash text primary key, user_id uuid not null, access_token text not null,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index owner_sessions_expiry on public.owner_sessions(expires_at);
create table public.rate_buckets (
  key text primary key, hits int not null default 1, expires_at timestamptz not null
);
create index rate_buckets_expiry on public.rate_buckets(expires_at);
create table public.events (
  id uuid primary key, name text not null check (name in ('page_view','section_view','project_view','project_open','project_external_click','github_click','linkedin_click','hero_cta_click','email_click','contact_click','contact_form_open','contact_form_started','contact_form_submitted','intro_skipped','3d_interaction')),
  visitor text not null, session text not null, project text,
  section text, referrer text not null default 'Direct / unavailable',
  campaign text not null default '', source text not null default '', medium text not null default '',
  device text not null, browser text not null, os text not null, screen text not null,
  returning_browser boolean not null default false, country text not null default '',
  created_at timestamptz not null default now()
);
create index events_time on public.events(created_at desc);
create index events_project on public.events(project, name, created_at desc);
create index events_visitors on public.events(visitor, created_at desc);
create index events_pageviews on public.events(created_at desc, visitor) where name = 'page_view';

-- No browser/database role can read or mutate these tables. Server authorization
-- is mandatory before using the service role. RLS provides defense in depth.
alter table public.signals enable row level security;
alter table public.owner_sessions enable row level security;
alter table public.rate_buckets enable row level security;
alter table public.events enable row level security;
revoke all on public.signals, public.owner_sessions, public.rate_buckets, public.events from public, anon, authenticated;
grant all on public.signals, public.owner_sessions, public.rate_buckets, public.events to service_role;

create function public.take_rate(p_key text, p_limit int, p_seconds int) returns boolean
language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  insert into rate_buckets(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set
    hits=case when rate_buckets.expires_at<=now() then 1 else rate_buckets.hits+1 end,
    expires_at=case when rate_buckets.expires_at<=now() then now()+make_interval(secs=>p_seconds) else rate_buckets.expires_at end
  returning hits into n;
  return n<=p_limit;
end $$;

-- The submitted UUID makes retries idempotent, without exposing an existing record.
create function public.receive_signal(p_signal jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
declare inserted int;
begin
  insert into signals(request_id,name,email,company,contact_type,message,budget,timeline,source_page)
  values((p_signal->>'request_id')::uuid,p_signal->>'name',p_signal->>'email',p_signal->>'company',p_signal->>'contact_type',p_signal->>'message',p_signal->>'budget',p_signal->>'timeline','/')
  on conflict(request_id) do nothing;
  get diagnostics inserted = row_count;
  return inserted=1;
end $$;

create function public.control_overview(p_hours int default 168) returns jsonb
language plpgsql stable security invoker set search_path = public set timezone = 'UTC' as $$
declare since timestamptz; step interval; result jsonb;
begin
  if p_hours not in (24,168,720,2160) then raise exception 'Invalid range'; end if;
  since := now()-make_interval(hours=>p_hours);
  step := case when p_hours=24 then interval '1 hour' else interval '1 day' end;
  with periods(label,starts,previous) as (
    values ('Today',date_trunc('day',now()),date_trunc('day',now())-interval '1 day'),
      ('7 days',now()-interval '7 days',now()-interval '14 days'),
      ('30 days',now()-interval '30 days',now()-interval '60 days'),
      ('Retained history','-infinity'::timestamptz,'-infinity'::timestamptz)
  ), metrics as (
    select label,
      (select count(*) from events where name='page_view' and created_at>=starts) views,
      (select count(distinct visitor) from events where name='page_view' and created_at>=starts) visitors,
      (select count(distinct session) from events where name='page_view' and created_at>=starts) sessions,
      case when label='Retained history' then null else (select count(*) from events where name='page_view' and created_at>=previous and created_at<previous+(now()-starts)) end previous_views,
      case when label='Retained history' then null else (select count(distinct visitor) from events where name='page_view' and created_at>=previous and created_at<previous+(now()-starts)) end previous_visitors
    from periods
  ), buckets as (
    select generate_series(date_trunc(case when p_hours=24 then 'hour' else 'day' end,since),now(),step) at
  ), series as (
    select at, count(e.id) views,count(distinct e.visitor) visitors from buckets b left join events e
      on e.name='page_view' and e.created_at>=b.at and e.created_at<b.at+step and e.created_at>=since group by at order by at
  ), projects as (
    select project, count(*) filter(where name='project_view') views,
      count(*) filter(where name='project_open') opens,
      count(*) filter(where name='project_external_click') external_clicks,
      count(distinct session) filter(where name='project_view') viewed_sessions,
      count(distinct session) filter(where name='project_open') opened_sessions
    from events where project is not null and created_at>=since group by project
  ), dimensions as (
    select 'referrers' kind,referrer label,count(*) count from events where name='page_view' and created_at>=since group by referrer
    union all select 'devices',device,count(*) from events where name='page_view' and created_at>=since group by device
    union all select 'browsers',browser,count(*) from events where name='page_view' and created_at>=since group by browser
    union all select 'os',os,count(*) from events where name='page_view' and created_at>=since group by os
    union all select 'countries',coalesce(nullif(country,''),'Unavailable'),count(*) from events where name='page_view' and created_at>=since group by country
    union all select 'screens',screen,count(*) from events where name='page_view' and created_at>=since group by screen
    union all select 'visits',case when returning_browser then 'Returning browser' else 'First observed browser' end,count(*) from events where name='page_view' and created_at>=since group by returning_browser
    union all select 'campaigns',concat_ws(' / ',nullif(source,''),nullif(medium,''),nullif(campaign,'')),count(*) from events where name='page_view' and created_at>=since and (source<>'' or medium<>'' or campaign<>'') group by source,medium,campaign
    union all select 'sections',section,count(*) from events where name='section_view' and created_at>=since group by section
    union all select 'events',name,count(*) from events where created_at>=since group by name
  ), ranked_dimensions as (
    select d.*, row_number() over(partition by kind order by count desc, label) rank,
      sum(count) over(partition by kind) total from dimensions d
  ) select jsonb_build_object(
    'metrics',(select jsonb_agg(to_jsonb(m)) from metrics m),
    'series',(select jsonb_agg(to_jsonb(s)) from series s),
    'projects',coalesce((select jsonb_agg(to_jsonb(p) order by opens desc) from projects p),'[]'::jsonb),
    'dimensions',coalesce((select jsonb_agg(to_jsonb(d) order by kind,count desc) from ranked_dimensions d where rank<=15),'[]'::jsonb),
    'recent',(select count(distinct visitor) from events where created_at>=now()-interval '30 minutes'),
    'new_signals',(select count(*) from signals where status='NEW'),
    'first_event',(select min(created_at) from events), 'generated_at',now()
  ) into result;
  return result;
end $$;

-- Schedule daily in Supabase. Retain events for 365 days; inbox for one year.
create function public.prune_control() returns void language sql security invoker set search_path = public as $$
  delete from events where created_at < now()-interval '365 days';
  delete from signals where created_at < now()-interval '365 days';
  delete from rate_buckets where expires_at < now();
  delete from owner_sessions where expires_at < now();
$$;
revoke execute on function public.take_rate(text,int,int), public.receive_signal(jsonb), public.control_overview(int), public.prune_control() from public, anon, authenticated;
grant execute on function public.take_rate(text,int,int), public.receive_signal(jsonb), public.control_overview(int), public.prune_control() to service_role;
commit;
