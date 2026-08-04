import Link from "next/link";
import { BarChart3, Mic2, Sparkles, Target } from "lucide-react";

const features = [
  { title: "Create goals", icon: Target },
  { title: "Speak your daily update", icon: Mic2 },
  { title: "Get AI progress insights", icon: Sparkles },
  { title: "See weekly patterns", icon: BarChart3 }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="container grid min-h-[86vh] content-center gap-10 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-coral">GoalVoice AI</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink md:text-6xl">Speak your day. Track your direction.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/72">
            Create goals, record a quick daily check-in, and see whether your actions are moving you in the right direction.
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
    </main>
  );
}
