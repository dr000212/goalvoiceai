# GoalVoice AI Production Checklist

## Required Before Real Users

- Rotate the OpenAI API key and Supabase service-role key before production use.
- In Supabase Auth URL settings, set the production site URL:
  - `https://goalvoiceai-fz7k.vercel.app`
- In Supabase Auth redirect URLs, add:
  - `https://goalvoiceai-fz7k.vercel.app/reset-password`
  - `http://localhost:3000/reset-password`
- In Render environment variables, set:
  - `CORS_ORIGINS=https://goalvoiceai-fz7k.vercel.app`
  - `CORS_ORIGIN_REGEX=https://.*\.vercel\.app`
- In Vercel environment variables, set:
  - `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL, without a trailing route.
- Run `supabase/migrations/006_goal_completed_status.sql` in Supabase SQL Editor.
- Run `supabase/migrations/007_profile_reminders.sql` in Supabase SQL Editor.
- Run `supabase/migrations/008_goal_specific_weekly_reports.sql` in Supabase SQL Editor.
- Add your Supabase user id to Render `ADMIN_USER_IDS` if you want access to `/admin`.

## Operations

- Use Render logs to inspect backend errors from `/check-ins/analyze`, `/check-ins/voice`, and `/reports/weekly/generate`.
- Use `/admin` in the frontend for basic production counts after setting `ADMIN_USER_IDS`.
- Confirm `/health` returns `{"status":"ok","service":"GoalVoice AI"}` after every backend deploy.
- Enable Supabase backups for the project plan before inviting real users.
- Keep `.env` and `.env.local` local only. Use Render and Vercel environment variables for deployed secrets.
- For error monitoring, create a Sentry project or similar monitoring service and wire its DSN in a future production pass.
- For subscriptions, connect Stripe or Lemon Squeezy before enforcing the plan limits shown in Settings.

## Next Product Upgrades

- The current reminder setting saves the user's preferred time and can show browser notifications while the app is open. Reliable reminders need a scheduled notification system. For web-only MVP, start with email reminders from a backend cron job or Supabase Edge Function.
- Calendar integration needs OAuth with Google Calendar or Outlook before the app can add events safely.
- Daily report PDF export currently uses browser print/save PDF. Dedicated designed PDFs can be added with a server PDF renderer later.
- Report search and export can be added after users have enough saved check-ins to make history useful.
