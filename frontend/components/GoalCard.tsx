import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";
import type { Goal } from "@/types/goal";

export function GoalCard({ goal, primaryAction = false }: { goal: Goal; primaryAction?: boolean }) {
  const isActive = goal.status === "active";

  return (
    <article className={`card p-6 ${primaryAction ? "min-h-full" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="pill bg-sage text-leaf">{goal.category || "Other"}</p>
          <h3 className="mt-4 text-2xl font-black leading-tight text-leaf">{goal.title}</h3>
        </div>
        <span className="pill bg-[#efede7] text-ink/75 capitalize">
          {goal.status === "completed" ? "Completed" : `${goal.importance} priority`}
        </span>
      </div>
      <p className="mt-6 text-base italic leading-7 text-ink/82">&quot;{goal.description || "No description yet."}&quot;</p>
      <div className="mt-6 grid grid-cols-2 gap-5 text-sm">
        <div>
          <p className="font-semibold text-ink/50">Daily Target</p>
          <p className="mt-1 text-lg font-black">{goal.daily_target || "Not set"}</p>
        </div>
        <div>
          <p className="font-semibold text-ink/50">Weekly Plan</p>
          <p className="mt-1 text-lg font-black">{goal.weekly_target || "Not set"}</p>
        </div>
      </div>
      {goal.target_date && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
          <CalendarDays className="h-4 w-4" aria-hidden /> {goal.target_date}
        </p>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {isActive && (
          <Link className={primaryAction ? "btn btn-primary sm:col-span-2" : "btn btn-primary"} href={`/check-in?goal=${goal.id}&title=${encodeURIComponent(goal.title)}`}>
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Check in today
          </Link>
        )}
        {!primaryAction && <Link className="btn btn-secondary" href={`/goals/${goal.id}`}>Open goal <ChevronRight className="h-4 w-4" aria-hidden /></Link>}
        {primaryAction && <Link className="btn btn-secondary sm:col-span-2" href={`/goals/${goal.id}`}>View or edit goal</Link>}
      </div>
    </article>
  );
}
