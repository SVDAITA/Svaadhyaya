-- ============================================================
-- SVAADHYAYA DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- Project: svaadhyaya.in
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  wake_time text default '05:30',
  sleep_time text default '22:30',
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DAYS  
-- One row per user per day. Core of Svadhyaya.
-- ============================================================
create table if not exists public.days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  habits jsonb default '{}',
  one_thing text,
  wins text[] default '{}',
  tomorrow_tasks text[] default '{}',
  mood text,
  energy text,
  quick_log text,
  disrupted boolean default false,
  disruption_mode text,
  disruption_reason text,
  disruption_note text,
  first_open timestamptz,
  last_close timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- ============================================================
-- MILESTONES
-- Active goals shown on dashboard
-- ============================================================
create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  area text not null,
  color text default '#C07830',
  progress integer default 0,
  target_date date,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- VACATIONS
-- Date ranges with mode
-- ============================================================
create table if not exists public.vacations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  mode text not null default 'sacred',
  from_date date not null,
  to_date date not null,
  note text,
  created_at timestamptz default now()
);

-- ============================================================
-- LOGS
-- Area-specific entries: weight, spend, achievements etc.
-- ============================================================
create table if not exists public.logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  type text not null,
  value text,
  numeric_value numeric,
  note text,
  date date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- WEEKLY MICRO GOALS
-- Small weekly targets — especially for Nadam
-- ============================================================
create table if not exists public.weekly_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  week_start date not null,
  title text not null,
  done boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- Flagged tasks that flow through morning flow → Today
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  area text,
  date date,
  done boolean default false,
  source text default 'manual',
  created_at timestamptz default now()
);

-- ============================================================
-- FINANCE LOGS
-- Daily spending tracker
-- ============================================================
create table if not exists public.finance_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  category text not null,
  description text,
  type text default 'needed',
  date date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- HEALTH LOGS
-- Weight, measurements, visceral fat etc.
-- ============================================================
create table if not exists public.health_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  value numeric not null,
  unit text,
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- BOOKS
-- Reading log
-- ============================================================
create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  language text default 'english',
  status text default 'reading',
  pages_read integer default 0,
  total_pages integer,
  started_date date,
  finished_date date,
  notes text,
  one_line text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- LAKSHYAS  (Long-term Goals — per Life Pillar)
-- ============================================================
create table if not exists public.lakshyas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  pillar text not null,            -- spirit | music | health | career | finance | reading
  status text default 'active',   -- active | archived | completed
  timeline_years integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SIDDHIS  (Milestones — children of a Lakshya)
-- ============================================================
create table if not exists public.siddhis (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lakshya_id uuid not null references public.lakshyas(id) on delete cascade,
  title text not null,
  progress_percent integer default 0,
  status text default 'active',   -- active | completed
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ANSHS  (Daily Micro-tasks — children of a Siddhi)
-- ============================================================
create table if not exists public.anshs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lakshya_id uuid not null references public.lakshyas(id) on delete cascade,
  siddhi_id uuid not null references public.siddhis(id) on delete cascade,
  title text not null,
  status text default 'active',   -- active | completed
  created_at timestamptz default now()
);

-- ============================================================
-- VISION CONTENT
-- Editable goal documents per area
-- ============================================================
create table if not exists public.vision_content (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  section text not null,
  content text,
  updated_at timestamptz default now(),
  unique(user_id, area, section)
);

-- ============================================================
-- ROW LEVEL SECURITY — CRITICAL
-- Every table is locked to the authenticated user only
-- ============================================================

alter table public.profiles enable row level security;
alter table public.days enable row level security;
alter table public.milestones enable row level security;
alter table public.vacations enable row level security;
alter table public.logs enable row level security;
alter table public.weekly_goals enable row level security;
alter table public.tasks enable row level security;
alter table public.finance_logs enable row level security;
alter table public.health_logs enable row level security;
alter table public.books enable row level security;
alter table public.vision_content enable row level security;
alter table public.lakshyas enable row level security;
alter table public.siddhis enable row level security;
alter table public.anshs enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Days
create policy "Users can manage own days" on public.days for all using (auth.uid() = user_id);

-- Milestones
create policy "Users can manage own milestones" on public.milestones for all using (auth.uid() = user_id);

-- Vacations
create policy "Users can manage own vacations" on public.vacations for all using (auth.uid() = user_id);

-- Logs
create policy "Users can manage own logs" on public.logs for all using (auth.uid() = user_id);

-- Weekly goals
create policy "Users can manage own weekly goals" on public.weekly_goals for all using (auth.uid() = user_id);

-- Tasks
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);

-- Finance logs
create policy "Users can manage own finance logs" on public.finance_logs for all using (auth.uid() = user_id);

-- Health logs
create policy "Users can manage own health logs" on public.health_logs for all using (auth.uid() = user_id);

-- Books
create policy "Users can manage own books" on public.books for all using (auth.uid() = user_id);

-- Vision content
create policy "Users can manage own vision content" on public.vision_content for all using (auth.uid() = user_id);

-- Lakshyas
create policy "Users can manage own lakshyas" on public.lakshyas for all using (auth.uid() = user_id);

-- Siddhis
create policy "Users can manage own siddhis" on public.siddhis for all using (auth.uid() = user_id);

-- Anshs
create policy "Users can manage own anshs" on public.anshs for all using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — Initial milestones for Subbu
-- These run after you create your account.
-- Replace 'YOUR_USER_ID' with your actual UUID from Supabase Auth.
-- ============================================================

-- INSTRUCTIONS: After creating your account, go to Supabase →
-- Authentication → Users → copy your UUID → replace below → run.

-- insert into public.milestones (user_id, title, area, color, progress, target_date) values
--   ('YOUR_USER_ID', '80kg by October 2026 — MacBook Air', 'health', '#2D7A4F', 8, '2026-10-31'),
--   ('YOUR_USER_ID', 'Data Architecture Designer exam', 'career', '#1A5FB0', 22, '2026-08-31'),
--   ('YOUR_USER_ID', 'Anthropic Claude AI Courses', 'career', '#7C4DAB', 40, '2026-06-30'),
--   ('YOUR_USER_ID', 'Axis Large Loan closed (May 2028)', 'finance', '#1A7A6E', 28, '2028-05-31'),
--   ('YOUR_USER_ID', 'Sangeeta Visharada Year 2', 'music', '#7C4DAB', 30, '2027-04-30');

-- ============================================================
-- DONE. Your database is ready.
-- ============================================================
