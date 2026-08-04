alter table public.goals enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_analyses enable row level security;
alter table public.weekly_reports enable row level security;

create policy "Users can select own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

create policy "Users can select own check-ins" on public.check_ins for select using (auth.uid() = user_id);
create policy "Users can insert own check-ins" on public.check_ins for insert with check (auth.uid() = user_id);
create policy "Users can update own check-ins" on public.check_ins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own check-ins" on public.check_ins for delete using (auth.uid() = user_id);

create policy "Users can select own analyses" on public.check_in_analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.check_in_analyses for insert with check (auth.uid() = user_id);
create policy "Users can update own analyses" on public.check_in_analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own analyses" on public.check_in_analyses for delete using (auth.uid() = user_id);

create policy "Users can select own weekly reports" on public.weekly_reports for select using (auth.uid() = user_id);
create policy "Users can insert own weekly reports" on public.weekly_reports for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly reports" on public.weekly_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own weekly reports" on public.weekly_reports for delete using (auth.uid() = user_id);
