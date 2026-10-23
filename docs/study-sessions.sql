create table public.study_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null check (subject in ('biology','mathematics','chemistry','physics')),
 mode text not null check (mode in ('revision','past-paper')),
 started_at timestamptz not null,
 ended_at timestamptz not null,
 duration_ms bigint not null check (duration_ms > 0),
 studied_on date not null,
 created_at timestamptz not null default now(),
 constraint study_duration_matches check (ended_at > started_at and abs(duration_ms - extract(epoch from (ended_at - started_at))*1000) < 2)
);
create index study_sessions_user_day on public.study_sessions(user_id, studied_on desc);
alter table public.study_sessions enable row level security;
revoke all on public.study_sessions from anon, authenticated;
grant select, insert, update on public.study_sessions to authenticated;
create policy study_read_own on public.study_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy study_insert_own on public.study_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy study_update_own on public.study_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
