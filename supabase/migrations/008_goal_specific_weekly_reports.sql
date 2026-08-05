alter table public.weekly_reports
  add column if not exists goal_id uuid references public.goals(id) on delete set null;

create index if not exists weekly_reports_user_goal_created_idx
  on public.weekly_reports(user_id, goal_id, created_at desc);

notify pgrst, 'reload schema';
