import type { Goal } from "@/types/goal";

export function GoalSwitcher({
  goals,
  selectedGoalId,
  onSelect
}: {
  goals: Goal[];
  selectedGoalId: string;
  onSelect: (goalId: string) => void;
}) {
  if (goals.length <= 1) return null;

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3">
        {goals.slice(0, 5).map((goal) => {
          const active = selectedGoalId === goal.id;
          return (
            <button
              key={goal.id}
              className={`depth-tile min-w-40 rounded-2xl border px-5 py-4 text-left transition ${
                active ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white text-ink hover:border-leaf/35"
              }`}
              onClick={() => onSelect(goal.id)}
              type="button"
            >
              <span className={`block text-[10px] font-black uppercase tracking-wide ${active ? "text-sage" : "text-ink/45"}`}>
                Goal
              </span>
              <span className="mt-1 block truncate text-sm font-black">{goal.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
