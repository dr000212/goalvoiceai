"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Goal } from "@/types/goal";
import type { CheckIn } from "@/types/checkin";

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
                {checkIns.slice(0, 5).map((item) => <p key={item.id} className="rounded-2xl bg-[#f5f4ef] p-4 text-sm leading-6">{item.transcript}</p>)}
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
