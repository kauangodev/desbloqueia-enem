alter table public.assessment_attempts
  add column if not exists collection_id text;

create index if not exists assessment_attempts_collection_idx
  on public.assessment_attempts (user_id, collection_id, completed_at desc);

