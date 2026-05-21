-- naada_courses: music examination / course tracking
create table if not exists naada_courses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  institution      text,
  instrument       text,
  level            text,
  status           text not null default 'in_progress',
  start_date       date,
  exam_date        date,
  completion_date  date,
  result           text,
  guru             text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table naada_courses enable row level security;

create policy "naada_courses_self" on naada_courses
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger naada_courses_updated_at
  before update on naada_courses
  for each row execute function set_updated_at();
