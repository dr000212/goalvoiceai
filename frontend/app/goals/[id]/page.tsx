"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Goal } from "@/types/goal";
import type { CheckIn } from "@/types/checkin";

function scoreAverage(checkIns: CheckIn[]) {
  const scores = checkIns.map((item) => item.analysis?.overall_score).filter((score): score is number => score != null);
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
}

function goalStreak(checkIns: CheckIn[]) {
  const dates = new Set(checkIns.map((item) => item.check_in_date).filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Goal>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    api.get<Goal>(`/goals/${params.id}`).then((loaded) => {
      setGoal(loaded);
      setDraft(loaded);
    });
    api.get<CheckIn[]>(`/check-ins?goal_id=${params.id}`).then(setCheckIns).catch(() => setCheckIns([]));
  }, [params.id]);

  async function archive() {
    await api.post(`/goals/${params.id}/archive`);
    router.push("/goals");
  }

  async function complete() {
    await api.post(`/goals/${params.id}/complete`);
    router.push("/goals");
  }

  async function deleteGoal() {
    await api.delete(`/goals/${params.id}`);
    router.push("/goals");
  }

  async function save() {
    const updated = await api.put<Goal>(`/goals/${params.id}`, {
      title: draft.title,
      category: draft.category,
      description: draft.description,
      target_date: draft.target_date || null,
      weekly_target: draft.weekly_target,
      daily_target: draft.daily_target,
      importance: draft.importance
    });
    setGoal(updated);
    setDraft(updated);
    setEditing(false);
  }

  const average = scoreAverage(checkIns);
  const latest = checkIns[0];
  const repeatedBlockers = checkIns.flatMap((item) => item.analysis?.blockers?.map((blocker) => blocker.blocker) || []).slice(0, 4);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-6 pb-16 pt-8">
        {!goal ? <p className="card p-6">Opening goal...</p> : (
          <>
            <section className="hero-panel p-8 md:p-10">
              <div className="relative z-10">
                <p className="pill bg-sage text-leaf">{goal.category}</p>
                <h1 className="mt-5 text-4xl font-black leading-tight text-white">{goal.title}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">{goal.description || "No description yet."}</p>
                <div className="mt-7 grid gap-4 text-sm text-white md:grid-cols-3">
                  <p><strong className="block text-white/55">Daily target</strong> {goal.daily_target || "Not set"}</p>
                  <p><strong className="block text-white/55">Weekly target</strong> {goal.weekly_target || "Not set"}</p>
                  <p><strong className="block text-white/55">Target date</strong> {goal.target_date || "Not set"}</p>
                </div>
              </div>
              <div className="relative z-10 mt-7 flex flex-wrap gap-3">
                <button className="btn btn-secondary" onClick={() => setEditing((value) => !value)}>Edit goal</button>
                <button className="btn btn-primary" onClick={complete}>Mark completed</button>
                <button className="btn btn-secondary" onClick={archive}>Archive goal</button>
                <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>Delete goal</button>
              </div>
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="card depth-tile p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Goal streak</p>
                <p className="mt-3 text-4xl font-black text-leaf">{goalStreak(checkIns)}</p>
                <p className="mt-1 text-sm text-ink/60">days for this goal</p>
              </div>
              <div className="card depth-tile p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Average score</p>
                <p className="mt-3 text-4xl font-black text-leaf">{average ?? "--"}/100</p>
                <p className="mt-1 text-sm text-ink/60">across saved check-ins</p>
              </div>
              <div className="card depth-tile p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Latest result</p>
                <p className="mt-3 text-4xl font-black text-leaf">{latest?.analysis?.overall_score ?? "--"}/100</p>
                <p className="mt-1 text-sm text-ink/60">{latest?.check_in_date || "No report yet"}</p>
              </div>
            </section>
            <section className="card p-6">
              <h2 className="section-title">Score trend</h2>
              <div className="mt-5 flex h-32 items-end gap-3">
                {checkIns.slice(0, 10).reverse().map((item) => {
                  const score = item.analysis?.overall_score || 0;
                  return (
                    <div key={item.id} className="grid flex-1 gap-2 text-center">
                      <div className="rounded-t-2xl bg-leaf shadow-soft" style={{ height: `${Math.max(8, score)}%` }} title={`${score}/100`} />
                      <span className="text-[10px] font-bold text-ink/50">{item.check_in_date?.slice(5) || ""}</span>
                    </div>
                  );
                })}
                {checkIns.length === 0 && <p className="text-sm text-ink/65">Check in for this goal to build a score trend.</p>}
              </div>
            </section>
            {repeatedBlockers.length > 0 && (
              <section className="card p-6">
                <h2 className="section-title">Repeated blockers</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {repeatedBlockers.map((blocker) => <span key={blocker} className="pill bg-[#fbf4ef] text-coral">{blocker}</span>)}
                </div>
              </section>
            )}
            {editing && (
              <section className="card grid gap-4 p-6">
                <input className="field" value={draft.title || ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                <input className="field" value={draft.category || ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
                <textarea className="field min-h-24" value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                <input className="field" type="date" value={draft.target_date || ""} onChange={(event) => setDraft({ ...draft, target_date: event.target.value })} />
                <input className="field" value={draft.daily_target || ""} onChange={(event) => setDraft({ ...draft, daily_target: event.target.value })} />
                <input className="field" value={draft.weekly_target || ""} onChange={(event) => setDraft({ ...draft, weekly_target: event.target.value })} />
                <select className="field" value={draft.importance || "medium"} onChange={(event) => setDraft({ ...draft, importance: event.target.value as Goal["importance"] })}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
                <button className="btn btn-primary" onClick={save}>Save changes</button>
              </section>
            )}
            <section className="card p-5">
              <h2 className="section-title">Related check-ins</h2>
              <div className="mt-3 grid gap-3">
                {checkIns.slice(0, 5).map((item) => (
                  <button key={item.id} className="rounded-2xl bg-[#f5f4ef] p-4 text-left text-sm leading-6" onClick={() => router.push(`/check-in/${item.id}/result`)}>
                    <span className="font-black">{item.check_in_date} - {item.analysis?.overall_score ?? "--"}/100</span>
                    <span className="mt-2 line-clamp-2 block text-ink/70">{item.transcript}</span>
                  </button>
                ))}
                {checkIns.length === 0 && <p className="text-sm text-ink/65">No check-ins yet.</p>}
              </div>
            </section>
            {confirmingDelete && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
                <section className="card max-w-md p-6">
                  <h2 className="text-xl font-black">Delete this goal?</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/72">
                    This permanently removes the goal from your account. Your past check-ins and analyses will stay saved.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="btn btn-secondary" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                    <button className="btn btn-danger" onClick={deleteGoal}>Confirm delete</button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
