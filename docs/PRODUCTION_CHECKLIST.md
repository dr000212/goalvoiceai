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

## Operations

- Use Render logs to inspect backend errors from `/check-ins/analyze`, `/check-ins/voice`, and `/reports/weekly/generate`.
- Confirm `/health` returns `{"status":"ok","service":"GoalVoice AI"}` after every backend deploy.
- Enable Supabase backups for the project plan before inviting real users.
- Keep `.env` and `.env.local` local only. Use Render and Vercel environment variables for deployed secrets.

## Next Product Upgrades

- Daily reminders need a scheduled notification system. For web-only MVP, start with email reminders from a backend cron job or Supabase Edge Function.
- Calendar integration needs OAuth with Google Calendar or Outlook before the app can add events safely.
- Report search and export can be added after users have enough saved check-ins to make history useful.
