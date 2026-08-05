alter table public.goals
  drop constraint if exists goals_status_check;

alter table public.goals
  add constraint goals_status_check check (status in ('active', 'completed', 'archived'));

notify pgrst, 'reload schema';
