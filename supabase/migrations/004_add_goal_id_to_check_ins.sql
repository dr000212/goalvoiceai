alter table public.check_ins
add column if not exists goal_id uuid references public.goals(id) on delete set null;

notify pgrst, 'reload schema';
