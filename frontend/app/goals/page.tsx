"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Eye, Plus, Target } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Goal } from "@/types/goal";

type GoalFilter = "active" | "completed" | "all";

function statusLabel(status: Goal["status"]) {
  if (status === "completed") return "Completed";
  if (status === "archived") return "Archived";
  return "Ongoing";
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<GoalFilter>("active");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Goal[]>("/goals?include_completed=true")
      .then(setGoals)
      .catch((err) => setError(err.message));
  }, []);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedGoals = goals.filter((goal) => goal.status === "completed");
  const visibleGoals = useMemo(() => {
    if (filter === "completed") return completedGoals;
    if (filter === "all") return goals;
    return activeGoals;
  }, [activeGoals, completedGoals, filter, goals]);

  const filterItems: { id: GoalFilter; label: string; count: number }[] = [
    { id: "active", label: "Ongoing", count: activeGoals.length },
    { id: "completed", label: "Completed", count: completedGoals.length },
    { id: "all", label: "All goals", count: goals.length }
  ];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-20 pt-8">
        <section className="hero-panel px-7 py-9 md:px-10">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-sage">Goal manager</p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-white">Your Goals</h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-white/82">
                See what is ongoing, reopen completed goals for review, and add the next target when you are ready.
              </p>
            </div>
            <Link className="btn bg-white text-leaf" href="/goals/new">
              <Plus className="h-5 w-5" aria-hidden /> Add new goal
            </Link>
          </div>
        </section>

        {error && <p className="card p-4 text-coral">{error}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card depth-tile p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Ongoing</p>
            <p className="mt-3 text-4xl font-black text-leaf">{activeGoals.length}</p>
          </div>
          <div className="card depth-tile p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Completed</p>
            <p className="mt-3 text-4xl font-black text-leaf">{completedGoals.length}</p>
          </div>
          <div className="card depth-tile p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Total</p>
            <p className="mt-3 text-4xl font-black text-leaf">{goals.length}</p>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex flex-wrap gap-2">
            {filterItems.map((item) => (
              <button
                key={item.id}
                className={`btn ${filter === item.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.id === "completed" ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <Circle className="h-5 w-5" aria-hidden />}
                {item.label}
                <span className="pill bg-white/75 text-leaf">{item.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {visibleGoals.map((goal) => (
            <article key={goal.id} className={goal.status === "completed" ? "relative" : ""}>
              {goal.status === "completed" && (
                <div className="absolute right-5 top-5 z-10 rounded-full bg-sage px-3 py-1 text-xs font-black uppercase text-leaf">
                  Completed
                </div>
              )}
              <GoalCard goal={goal} />
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`pill ${goal.status === "active" ? "bg-sage text-leaf" : "bg-[#f5f4ef] text-ink/60"}`}>
                  {statusLabel(goal.status)}
                </span>
                <Link className="pill bg-white text-leaf shadow-soft" href={`/goals/${goal.id}`}>
                  <Eye className="mr-1 h-4 w-4" aria-hidden /> View or edit
                </Link>
              </div>
            </article>
          ))}
        </section>

        {visibleGoals.length === 0 && (
          <section className="card grid place-items-center gap-4 p-8 text-center">
            <Target className="h-12 w-12 text-leaf" aria-hidden />
            <h2 className="text-2xl font-black text-leaf">No goals in this view</h2>
            <p className="max-w-lg text-ink/65">Switch the filter or add a new goal to start tracking your next direction.</p>
          </section>
        )}

        <section className="card grid gap-4 p-6 text-center">
          <h2 className="text-2xl font-black text-leaf">Ready for the next target?</h2>
          <p className="text-ink/65">Add one clear goal with a daily action and GoalVoice will help you check in against it.</p>
          <Link className="btn btn-primary mx-auto" href="/goals/new">
            <Plus className="h-5 w-5" aria-hidden /> Add goal
          </Link>
        </section>
      </main>
    </ProtectedRoute>
  );
}
