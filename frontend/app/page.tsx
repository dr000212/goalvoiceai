import Link from "next/link";
import { BarChart3, Bell, Lock, Mic2, Sparkles, Target } from "lucide-react";

const features = [
  { title: "Create goal-based check-ins", icon: Target },
  { title: "Speak or type your daily update", icon: Mic2 },
  { title: "Get AI insight and next action", icon: Sparkles },
  { title: "Unlock weekly reports after 7 days", icon: BarChart3 }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="container grid min-h-[78vh] content-center gap-10 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-coral">GoalVoice AI</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink md:text-6xl">Speak your day. Track your direction.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/72">
            A private AI accountability journal for people who want daily action, honest progress scores, and weekly patterns without complicated tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/signup">Get Started</Link>
            <Link className="btn btn-secondary" href="/login">Login</Link>
          </div>
        </div>
        <div className="card grid gap-4 p-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-4">
                <Icon className="h-5 w-5 text-leaf" aria-hidden />
                <span className="font-bold">{feature.title}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container grid gap-5 pb-16 md:grid-cols-3">
        <div className="card depth-tile p-6">
          <Bell className="h-7 w-7 text-leaf" aria-hidden />
          <h2 className="mt-4 text-2xl font-black">Daily rhythm</h2>
          <p className="mt-2 leading-7 text-ink/65">Set a reminder time, check in for one goal, and keep your streak alive.</p>
        </div>
        <div className="card depth-tile p-6">
          <Lock className="h-7 w-7 text-leaf" aria-hidden />
          <h2 className="mt-4 text-2xl font-black">Private by design</h2>
          <p className="mt-2 leading-7 text-ink/65">Your goals, transcripts, and reports stay in your account and can be exported or deleted.</p>
        </div>
        <div className="card depth-tile p-6">
          <Sparkles className="h-7 w-7 text-leaf" aria-hidden />
          <h2 className="mt-4 text-2xl font-black">MVP access</h2>
          <p className="mt-2 leading-7 text-ink/65">Free MVP usage includes goal tracking, voice transcription, daily reports, and weekly unlocks.</p>
        </div>
      </section>
    </main>
  );
}
