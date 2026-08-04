"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

const categories = ["Career", "Fitness", "Study", "Business", "Productivity", "Personal", "Other"];
const importanceOptions = [
  { value: "low", label: "Low", help: "Nice to have. Missing a day is not a big problem." },
  { value: "medium", label: "Medium", help: "Important. You want steady progress most weeks." },
  { value: "high", label: "High", help: "Top priority. This goal should guide your daily choices." }
];

export default function NewGoalPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", category: "Career", description: "", target_date: "", weekly_target: "", daily_target: "", importance: "medium" });
  const [error, setError] = useState("");

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    try {
      await api.post("/goals", { ...form, target_date: form.target_date || null });
      router.push("/goals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create goal.");
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container max-w-4xl pb-16 pt-8">
        <div>
          <h1 className="page-title">Add Goal</h1>
          <p className="mt-4 max-w-3xl text-xl leading-8 text-ink/82">Tell GoalVoice what you are working toward. The daily check-in will compare your actions against this goal.</p>
        </div>
        <section className="card mt-10 grid gap-8 p-6 md:p-10">
          <label className="grid gap-2">
            <span className="font-black tracking-wide text-leaf">Goal name</span>
            <span className="text-sm text-ink/60">Write the outcome you want. Make it clear enough that you can check progress later.</span>
            <input className="field" placeholder="Example: Get an AI Engineer job" value={form.title} onChange={(event) => update("title", event.target.value)} />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-black tracking-wide text-leaf">Goal area</span>
              <span className="text-sm text-ink/60">Choose the life or work area this goal belongs to.</span>
              <select className="field" value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-black tracking-wide text-leaf">Target date</span>
              <span className="text-sm text-ink/60">Optional. Pick the date you want to reach this goal by.</span>
              <input className="field" type="date" value={form.target_date} onChange={(event) => update("target_date", event.target.value)} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="font-black tracking-wide text-leaf">What does success look like?</span>
            <span className="text-sm text-ink/60">Describe the goal in normal words. Include why it matters if that helps you stay focused.</span>
            <textarea className="field min-h-28" placeholder="Example: Apply for AI jobs, study AI engineering, improve portfolio projects, and prepare for interviews." value={form.description} onChange={(event) => update("description", event.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className="font-black tracking-wide text-leaf">Weekly plan</span>
            <span className="text-sm text-ink/60">What should be done in a normal week? This helps the weekly report judge your pattern.</span>
            <input className="field" placeholder="Example: Apply to 10 jobs, study 5 hours, update 1 portfolio project" value={form.weekly_target} onChange={(event) => update("weekly_target", event.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className="font-black tracking-wide text-leaf">Daily action</span>
            <span className="text-sm text-ink/60">What small action should you try to do each day? This is what daily check-ins compare against.</span>
            <input className="field" placeholder="Example: Apply to 1 job, study 1 hour, work on portfolio for 30 minutes" value={form.daily_target} onChange={(event) => update("daily_target", event.target.value)} />
          </label>

          <fieldset className="grid gap-3">
            <legend className="font-black tracking-wide text-leaf">Priority level</legend>
            <p className="text-sm text-ink/60">This tells the app how strongly this goal should influence your daily accountability.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {importanceOptions.map((option) => (
                <label key={option.value} className={`depth-tile cursor-pointer rounded-2xl border p-5 transition ${form.importance === option.value ? "border-leaf bg-sage" : "border-ink/10 bg-[#fbfaf6] hover:border-leaf/30"}`}>
                  <input className="sr-only" type="radio" name="importance" value={option.value} checked={form.importance === option.value} onChange={(event) => update("importance", event.target.value)} />
                  <span className="text-lg font-black">{option.label}</span>
                  <span className="mt-2 block text-sm leading-5 text-ink/65">{option.help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm font-semibold text-coral">{error}</p>}
          <button className="btn btn-primary min-h-14" onClick={submit}>Save goal</button>
        </section>
      </main>
    </ProtectedRoute>
  );
}
