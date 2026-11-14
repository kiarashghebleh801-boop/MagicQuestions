-- Phase 1 foundation. AI result writes are server-only; grading is not released.
create table public.marker_papers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null check(subject in ('Chemistry','Physics','Biology','Mathematics')),
 title text not null check(length(title) between 1 and 160), questions jsonb not null check(jsonb_typeof(questions)='array'),
 created_at timestamptz not null default now()
);
create table public.marker_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null check(subject in ('Chemistry','Physics','Biology','Mathematics')), title text not null check(length(title) between 1 and 160),
 mode text not null check(mode in ('generated','external')), paper_snapshot jsonb,
 status text not null default 'draft' check(status in ('draft','verified')),
 responses jsonb not null default '[]' check(jsonb_typeof(responses)='array'), created_at timestamptz not null default now()
);
create table public.marker_documents (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.marker_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, role text not null check(role in ('questions','answers','scheme')),
 path text not null unique, name text not null, mime text not null check(mime in ('application/pdf','image/png','image/jpeg')),
 bytes integer not null check(bytes between 1 and 26214400), pages integer not null check(pages between 1 and 60), position integer not null check(position>=0)
);
create table public.marker_criteria (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.marker_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, question_label text not null, source jsonb not null,
 criterion text not null, maximum numeric not null check(maximum>=0)
);
create table public.marker_results (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.marker_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, criterion_id uuid not null references public.marker_criteria(id),
 awarded numeric check(awarded>=0), feedback jsonb not null, needs_review boolean not null default true
);
create index on public.marker_papers(user_id,subject,created_at desc);
create index on public.marker_sessions(user_id,subject,created_at desc);
create index on public.marker_documents(session_id);
create index on public.marker_criteria(session_id);
create index on public.marker_results(session_id);
alter table public.marker_papers enable row level security;
alter table public.marker_sessions enable row level security;
alter table public.marker_documents enable row level security;
alter table public.marker_criteria enable row level security;
alter table public.marker_results enable row level security;
revoke all on public.marker_papers, public.marker_sessions, public.marker_documents, public.marker_criteria, public.marker_results from anon, authenticated;
grant select,insert,delete on public.marker_papers to authenticated;
grant select,insert,delete on public.marker_sessions to authenticated;
grant update(status) on public.marker_sessions to authenticated;
grant select,insert,delete on public.marker_documents to authenticated;
grant select on public.marker_criteria, public.marker_results to authenticated;
create policy marker_paper_owner on public.marker_papers for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy marker_session_owner on public.marker_sessions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy marker_doc_owner on public.marker_documents for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.marker_sessions s where s.id=session_id and s.user_id=(select auth.uid())) and split_part(path,'/',1)=(select auth.uid())::text and split_part(path,'/',2)=session_id::text);
create policy marker_criteria_read on public.marker_criteria for select to authenticated using(user_id=(select auth.uid()));
create policy marker_results_read on public.marker_results for select to authenticated using(user_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('marker-documents','marker-documents',false,26214400,array['application/pdf','image/png','image/jpeg']);
create policy marker_files_read on storage.objects for select to authenticated using(bucket_id='marker-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy marker_files_add on storage.objects for insert to authenticated with check(bucket_id='marker-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.marker_sessions s where s.id::text=(storage.foldername(name))[2] and s.user_id=(select auth.uid())));
create policy marker_files_delete on storage.objects for delete to authenticated using(bucket_id='marker-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
