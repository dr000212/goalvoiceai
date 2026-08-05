alter table public.profiles
  add column if not exists reminder_time text default '',
  add column if not exists reminder_enabled boolean default false;

notify pgrst, 'reload schema';
