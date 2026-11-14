-- Provisional AI artifacts are signed by the server. A client-written payload
-- is never trusted or shown as a result unless its signature verifies.
create table public.marker_ai_runs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references public.marker_sessions(id) on delete cascade,
 stage text not null check(stage in ('criteria','transcribe','mark')),
 created_at timestamptz not null default now(), payload text check(length(payload)<=1500000), signature text check(length(signature)=64)
);
create index marker_ai_session_stage on public.marker_ai_runs(session_id,stage,created_at desc);
alter table public.marker_ai_runs enable row level security;
revoke all on public.marker_ai_runs from public,anon,authenticated;
grant select on public.marker_ai_runs to authenticated;
grant update(payload,signature) on public.marker_ai_runs to authenticated;
create policy marker_ai_owner on public.marker_ai_runs for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
-- A separate usage ledger survives deletion of a submission, so deleting and
-- recreating papers cannot reset quotas. It contains no student documents.
create table public.marker_ai_usage(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create index marker_ai_usage_time on public.marker_ai_usage(created_at,user_id);
alter table public.marker_ai_usage enable row level security;
revoke all on public.marker_ai_usage from public,anon,authenticated;
create function public.marker_claim_ai_run(p_session uuid,p_stage text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
 if v_user is null then raise exception 'Sign in to mark a paper.'; end if;
 if p_stage not in ('criteria','transcribe','mark') then raise exception 'Invalid marking step.'; end if;
 if not exists(select 1 from public.marker_sessions where id=p_session and user_id=v_user and status='verified') then raise exception 'Save and verify this submission first.'; end if;
 perform pg_advisory_xact_lock(17843023);
 if (select count(*) from public.marker_ai_usage where created_at>now()-interval '1 hour' and user_id=v_user)>=12
 or (select count(*) from public.marker_ai_usage where created_at>now()-interval '24 hours' and user_id=v_user)>=36
 or (select count(*) from public.marker_ai_usage where created_at>now()-interval '24 hours')>=300 then
  raise exception 'AI test usage limit reached. Try again later.';
 end if;
 if exists(select 1 from public.marker_ai_runs where session_id=p_session and stage=p_stage and created_at>now()-interval '90 seconds' and payload is null) then raise exception 'This step is already running. Wait 90 seconds before retrying.'; end if;
 insert into public.marker_ai_usage(user_id) values(v_user);
 insert into public.marker_ai_runs(user_id,session_id,stage) values(v_user,p_session,p_stage) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.marker_claim_ai_run(uuid,text) from public,anon;
grant execute on function public.marker_claim_ai_run(uuid,text) to authenticated;
