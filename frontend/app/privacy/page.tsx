import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-10">
      <Link className="text-sm font-bold text-leaf" href="/">GoalVoice AI</Link>
      <h1 className="mt-4 text-3xl font-black">Privacy Policy</h1>
      <div className="card mt-6 grid gap-4 p-6 leading-7 text-ink/74">
        <p>GoalVoice AI collects your email address for login through Supabase Auth.</p>
        <p>The app stores your goals, daily check-in transcripts, and AI-generated analyses and weekly reports.</p>
        <p>Voice audio may be temporarily processed for transcription. Audio is not permanently stored in this MVP.</p>
        <p>OpenAI is used for transcription and analysis. Supabase is used for authentication and database storage.</p>
        <p>You can delete your stored app data from Settings. AI feedback may be imperfect.</p>
        <p><strong>Disclaimer:</strong> GoalVoice AI is a productivity and accountability app. It does not provide medical, mental-health, therapy, legal, or financial advice. AI feedback may be imperfect and should be used as guidance only.</p>
      </div>
    </main>
  );
}
