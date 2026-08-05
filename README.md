# GoalVoice AI

Speak your day. Track your direction.

GoalVoice AI is a voice-first goal accountability MVP. Users create goals, submit text or voice daily check-ins, review AI analysis, and generate weekly progress reports.

## Structure

- `frontend`: Next.js, TypeScript, Tailwind CSS, Supabase Auth, PWA-ready manifest.
- `backend`: FastAPI, Pydantic, Supabase client, OpenAI analysis and transcription services.
- `supabase/migrations`: Postgres schema, RLS policies, and demo seed data.
- `docs`: privacy draft, manual testing checklist, and future Android plan.

## Setup

1. Create a Supabase project and run the SQL migrations in order.
2. Copy `frontend/.env.example` to `frontend/.env.local` and fill in the public Supabase values and API URL.
3. Copy `backend/.env.example` to `backend/.env` and fill in Supabase backend credentials plus `OPENAI_API_KEY`.
4. Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

5. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Security Notes

- OpenAI API keys and Supabase service-role keys stay in the backend only.
- Frontend uses Supabase anon key and sends the Supabase user JWT to the backend.
- Backend routes verify bearer tokens before reading or writing user data.
- Supabase RLS policies restrict users to their own rows.
- Audio is processed temporarily for transcription and is not stored by the MVP.
- See `docs/PRODUCTION_CHECKLIST.md` before inviting real users.

## Tests

```bash
cd backend
pytest
```

The backend tests use mocked Supabase/OpenAI boundaries for fast local validation.

## Deploy

### 1. Push to GitHub

Create an empty GitHub repository, then connect this local project:

```bash
git add .
git commit -m "Build GoalVoice AI MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit real `.env` or `.env.local` files.

### 2. Backend on Render

Render can use the root `render.yaml` blueprint. Set these backend environment variables in Render:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIPTION_MODEL`
- `DATABASE_URL` if you use it
- `CORS_ORIGINS`, including your final Vercel URL

The backend health URL is `/health`.

### 3. Frontend on Vercel

Import the same GitHub repo into Vercel and set:

- Root directory: `frontend`
- Framework: Next.js
- Build command: `npm run build`
- Output: Next.js default

Set these Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`, using your Render backend URL

After Vercel gives you the production URL, add it to Render `CORS_ORIGINS`, then redeploy the Render backend.
