"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, Edit3, History, MinusCircle, Rocket, Save, SmilePlus, Sparkles, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { scoreStatus } from "@/components/ScoreCard";
import { api } from "@/lib/api";
import type { CheckIn } from "@/types/checkin";

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get<CheckIn>(`/check-ins/${params.id}`).then((loaded) => {
      setCheckIn(loaded);
      setDraft(loaded.transcript);
    });
  }, [params.id]);

  async function reanalyze() {
    setSaving(true);
    setMessage("");
    try {
      const result = await api.put<{ check_in: CheckIn; analysis: CheckIn["analysis"] }>(`/check-ins/${params.id}/reanalyze`, { transcript: draft });
      setCheckIn({ ...result.check_in, analysis: result.analysis });
      setEditing(false);
      setMessage("Updated and re-analyzed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update this report.");
    } finally {
      setSaving(false);
    }
  }

  const analysis = checkIn?.analysis;
  const dateLabel = checkIn?.check_in_date
    ? new Date(`${checkIn.check_in_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
    : "";

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black leading-tight">Daily Result</h1>
            <p className="mt-4 text-xl text-ink/65">Reflecting on your progress{dateLabel ? ` for ${dateLabel}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={() => setEditing((value) => !value)} type="button">
              <Edit3 className="h-5 w-5" aria-hidden /> Edit check-in
            </button>
            <span className="pill bg-sage text-leaf">Journal Synchronized</span>
          </div>
        </div>
        {editing && (
          <section className="card grid gap-4 p-6">
            <h2 className="text-2xl font-black text-leaf">Edit transcript and re-run AI</h2>
            <textarea className="field min-h-40" value={draft} onChange={(event) => setDraft(event.target.value)} />
            {message && <p className="text-sm font-semibold text-coral">{message}</p>}
            <button className="btn btn-primary w-fit" onClick={reanalyze} disabled={saving} type="button">
              <Save className="h-5 w-5" aria-hidden /> {saving ? "Updating..." : "Save and re-analyze"}
            </button>
          </section>
        )}
        {!editing && message && <p className="card p-4 text-sm font-semibold text-leaf">{message}</p>}
        {!analysis ? <p className="card p-6">Preparing your analysis...</p> : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.48fr]">
              <section className="card grid gap-5 p-8 md:grid-cols-[1fr_0.35fr]">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-ink/58">Today&apos;s Goal Score</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <p className="text-5xl font-black text-leaf">{analysis.overall_score}/100</p>
                    <span className="pill bg-leaf/90 text-white">{scoreStatus(analysis.overall_score)}</span>
                  </div>
                  <p className="mt-6 max-w-2xl text-xl leading-8 text-ink/72">{analysis.insight}</p>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <Sparkles className="h-28 w-28 text-leaf/75" aria-hidden />
                </div>
              </section>
              <section className="card p-7">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-black tracking-wide text-ink/70">Mood & Energy</h2>
                  <SmilePlus className="h-7 w-7 text-leaf" aria-hidden />
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <span className="depth-icon grid h-16 w-16 place-items-center rounded-full bg-sage text-leaf">
                    <SmilePlus className="h-8 w-8" aria-hidden />
                  </span>
                  <div>
                    <p className="text-3xl font-black">{analysis.mood || "Not noted"}</p>
                    <p className="font-semibold text-ink/55">Calm & Focused</p>
                  </div>
                </div>
                <div className="mt-7">
                  <div className="mb-2 flex justify-between text-sm font-black">
                    <span>Energy Level</span>
                    <span>{analysis.energy_level}/10</span>
                  </div>
                  <div className="h-3 rounded-full bg-ink/10">
                    <div className="h-3 rounded-full bg-leaf" style={{ width: `${Math.max(0, Math.min(100, (analysis.energy_level || 0) * 10))}%` }} />
                  </div>
                </div>
              </section>
            </div>
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
              <section className="card p-7">
                <h2 className="flex items-center gap-3 text-lg font-black text-ink/72"><Sparkles className="h-6 w-6 text-leaf" aria-hidden /> Main Insight</h2>
                <p className="mt-6 text-2xl leading-10 text-ink/82">{analysis.insight}</p>
              </section>
              <section className="card bg-leaf p-8 text-white">
                <div className="flex items-center gap-5">
                  <span className="depth-icon grid h-20 w-20 place-items-center rounded-full bg-white/10">
                    <Rocket className="h-10 w-10 text-sage" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-sage">Tomorrow&apos;s Recommended Action</p>
                    <p className="mt-4 text-3xl font-black leading-tight text-sage">{analysis.tomorrow_action}</p>
                  </div>
                </div>
                <Link href="/check-in" className="btn mt-6 bg-white text-leaf">
                  Add to Calendar <CalendarPlus className="h-5 w-5" aria-hidden />
                </Link>
              </section>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <section className="card border-l-4 border-l-leaf p-6">
                <h2 className="flex items-center gap-2 text-3xl font-black text-leaf"><CheckCircle2 className="h-7 w-7" aria-hidden /> Completed</h2>
                <ul className="mt-5 grid gap-3 text-lg">
                  {analysis.completed_actions.length === 0 && <li className="italic text-ink/55">No completed actions were identified.</li>}
                  {analysis.completed_actions.map((item) => <li className="flex gap-2" key={item.action}><span>•</span><span>{item.action}</span></li>)}
                </ul>
              </section>
              <section className="card border-l-4 border-l-ink/25 p-6">
                <h2 className="flex items-center gap-2 text-3xl font-black text-ink/52"><XCircle className="h-7 w-7" aria-hidden /> Missed</h2>
                <ul className="mt-5 grid gap-3 text-lg">
                  {analysis.missed_actions.length === 0 && <li className="italic text-ink/55">None. Great efficiency today!</li>}
                  {analysis.missed_actions.map((item) => <li className="flex gap-2" key={item.action}><span>•</span><span>{item.action}</span></li>)}
                </ul>
              </section>
              <section className="card border-l-4 border-l-coral p-6">
                <h2 className="flex items-center gap-2 text-3xl font-black text-coral"><MinusCircle className="h-7 w-7" aria-hidden /> Blockers</h2>
                <ul className="mt-5 grid gap-3 text-lg font-semibold text-ink/72">
                  {analysis.blockers.length === 0 && <li className="italic text-ink/55">No blockers recorded.</li>}
                  {analysis.blockers.map((item) => <li key={item.blocker}>{item.blocker}</li>)}
                </ul>
              </section>
            </div>
            <section className="card p-7">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black tracking-wide text-ink/70">Goal Scores Breakdown</h2>
                <History className="h-6 w-6 text-ink/50" aria-hidden />
              </div>
              <div className="mt-6 grid gap-4">
                {analysis.goal_scores.map((goal) => (
                  <div key={goal.goal_id} className="depth-tile rounded-2xl border border-ink/8 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xl font-black">{goal.goal_title} <span className="ml-2 text-leaf">{goal.score}/100</span> <span className="pill bg-sage text-leaf">{scoreStatus(goal.score)}</span></p>
                      <div className="h-3 w-40 rounded-full bg-ink/10">
                        <div className="h-3 rounded-full bg-leaf" style={{ width: `${Math.max(0, Math.min(100, goal.score || 0))}%` }} />
                      </div>
                    </div>
                    <p className="mt-3 text-lg leading-7 text-ink/65">{goal.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
