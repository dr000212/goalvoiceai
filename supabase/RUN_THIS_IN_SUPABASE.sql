-- GoalVoice AI database setup
-- Run this in Supabase Dashboard > SQL Editor.

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

alter table public.check_ins add column if not exists goal_id uuid references public.goals(id) on delete set null;

notify pgrst, 'reload schema';

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

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  current_focus text,
  likes text,
  dislikes text,
  personal_context text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.goals enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_analyses enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can select own goals" on public.goals;
drop policy if exists "Users can insert own goals" on public.goals;
drop policy if exists "Users can update own goals" on public.goals;
drop policy if exists "Users can delete own goals" on public.goals;

create policy "Users can select own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own check-ins" on public.check_ins;
drop policy if exists "Users can insert own check-ins" on public.check_ins;
drop policy if exists "Users can update own check-ins" on public.check_ins;
drop policy if exists "Users can delete own check-ins" on public.check_ins;

create policy "Users can select own check-ins" on public.check_ins for select using (auth.uid() = user_id);
create policy "Users can insert own check-ins" on public.check_ins for insert with check (auth.uid() = user_id);
create policy "Users can update own check-ins" on public.check_ins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own check-ins" on public.check_ins for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own analyses" on public.check_in_analyses;
drop policy if exists "Users can insert own analyses" on public.check_in_analyses;
drop policy if exists "Users can update own analyses" on public.check_in_analyses;
drop policy if exists "Users can delete own analyses" on public.check_in_analyses;

create policy "Users can select own analyses" on public.check_in_analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.check_in_analyses for insert with check (auth.uid() = user_id);
create policy "Users can update own analyses" on public.check_in_analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own analyses" on public.check_in_analyses for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own weekly reports" on public.weekly_reports;
drop policy if exists "Users can insert own weekly reports" on public.weekly_reports;
drop policy if exists "Users can update own weekly reports" on public.weekly_reports;
drop policy if exists "Users can delete own weekly reports" on public.weekly_reports;

create policy "Users can select own weekly reports" on public.weekly_reports for select using (auth.uid() = user_id);
create policy "Users can insert own weekly reports" on public.weekly_reports for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly reports" on public.weekly_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own weekly reports" on public.weekly_reports for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can select own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
