create extension if not exists pgcrypto;

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  exam_board text not null default 'Pearson Edexcel',
  qualification text not null default 'International GCSE Mathematics A',
  year integer not null,
  session text not null,
  paper_code text not null,
  source_file text,
  created_at timestamptz not null default now(),
  unique(year, session, paper_code)
);

create table if not exists questions (
  id text primary key,
  paper_id uuid references papers(id) on delete cascade,
  question_number integer not null,
  marks integer not null,
  difficulty text not null check (difficulty in ('Easy','Medium','Hard')),
  summary text,
  extracted_text text,
  start_page integer,
  end_page integer,
  crop_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists topics (
  id bigint generated always as identity primary key,
  name text not null unique
);

create table if not exists question_topics (
  question_id text references questions(id) on delete cascade,
  topic_id bigint references topics(id) on delete cascade,
  primary key(question_id, topic_id)
);

create index if not exists questions_paper_id_idx on questions(paper_id);
create index if not exists question_topics_topic_id_idx on question_topics(topic_id);

-- Keep source PDFs and rendered question crops in a private Storage bucket.
-- The application should issue short-lived signed URLs only to authorized users.
