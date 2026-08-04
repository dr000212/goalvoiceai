create extension if not exists pgcrypto;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text,
  description text,
  target_date date,
  weekly_target text,
  daily_target text,
  importance text check (importance in ('low', 'medium', 'high')) default 'medium',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete set null,
  transcript text not null,
  input_type text check (input_type in ('text', 'voice')) not null,
  check_in_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.check_in_analyses (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid references public.check_ins(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood text,
  energy_level int,
  completed_actions jsonb default '[]'::jsonb,
  missed_actions jsonb default '[]'::jsonb,
  blockers jsonb default '[]'::jsonb,
  goal_scores jsonb default '[]'::jsonb,
  overall_score int,
  insight text,
  tomorrow_action text,
  raw_ai_response jsonb,
  created_at timestamptz default now()
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date,
  week_end_date date,
  overall_week_score int,
  goal_progress jsonb default '[]'::jsonb,
  best_day text,
  weakest_day text,
  repeated_blockers jsonb default '[]'::jsonb,
  positive_patterns jsonb default '[]'::jsonb,
  summary text,
  next_week_recommendations jsonb default '[]'::jsonb,
  raw_ai_response jsonb,
  created_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();
