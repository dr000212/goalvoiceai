-- Replace this user id with an auth.users id from your Supabase project before running.
do $$
declare demo_user uuid := '00000000-0000-0000-0000-000000000000';
begin
  insert into public.goals (user_id, title, category, weekly_target, daily_target, importance, status)
  values
    (demo_user, 'Get AI Engineer job', 'Career', 'Apply to 10 jobs, study 5 hours, update 1 portfolio project', 'Apply to 1 job, study 1 hour, work on portfolio for 30 minutes', 'high', 'active'),
    (demo_user, 'Improve fitness', 'Fitness', 'Walk 5 days and exercise 3 days', 'Walk 30 minutes', 'medium', 'active');

  insert into public.check_ins (user_id, transcript, input_type, check_in_date)
  values
    (demo_user, 'Applied to 2 jobs, studied LangGraph, felt motivated.', 'text', current_date - interval '6 days'),
    (demo_user, 'Walked 30 minutes, studied for 20 minutes, did not apply to jobs.', 'text', current_date - interval '5 days'),
    (demo_user, 'Updated portfolio, applied to 1 job, felt tired.', 'text', current_date - interval '4 days'),
    (demo_user, 'Skipped study because of low energy.', 'text', current_date - interval '3 days'),
    (demo_user, 'Applied to 3 jobs and prepared interview answers.', 'text', current_date - interval '2 days'),
    (demo_user, 'Worked on project for 1 hour.', 'text', current_date - interval '1 day'),
    (demo_user, 'Rested, reflected on the week, planned next week.', 'text', current_date);
end $$;
