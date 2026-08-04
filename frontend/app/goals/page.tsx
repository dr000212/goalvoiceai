"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoalCard } from "@/components/GoalCard";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Goal } from "@/types/goal";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Goal[]>("/goals").then(setGoals).catch((err) => setError(err.message));
  }, []);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-16 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Goals</h1>
            <p className="mt-3 text-ink/65">Manage every active goal and start today&apos;s check-in.</p>
          </div>
          <Link className="btn btn-primary" href="/goals/new">Add goal</Link>
        </div>
        {error && <p className="card p-4 text-coral">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
        </div>
        {goals.length === 0 && <p className="card p-5">Create your first goal to start tracking your direction.</p>}
      </main>
    </ProtectedRoute>
  );
}
