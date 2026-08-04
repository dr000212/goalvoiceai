import { Activity } from "lucide-react";

export function scoreStatus(score?: number | null) {
  if (score == null) return "Needs Attention";
  if (score >= 80) return "Strong Progress";
  if (score >= 60) return "On Track";
  if (score >= 40) return "Needs Attention";
  return "Falling Behind";
}

export function ScoreCard({ score, label = "Goal score", compact = false }: { score?: number | null; label?: string; compact?: boolean }) {
  const status = scoreStatus(score);
  return (
    <section className={`card p-5 ${compact ? "text-center" : ""}`}>
      <div className={compact ? "grid justify-items-center gap-3" : "flex items-center justify-between gap-4"}>
        <div className={compact ? "grid justify-items-center" : ""}>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/55">{label}</p>
          {compact ? (
            <div className="depth-icon mt-3 grid h-20 w-20 place-items-center rounded-full border-[5px] border-leaf bg-white text-xl font-black text-ink">
              {score ?? "--"}
            </div>
          ) : (
            <p className="mt-2 text-4xl font-black text-leaf">{score ?? "--"}/100</p>
          )}
        </div>
        {!compact && <Activity className="h-10 w-10 text-coral" aria-hidden />}
      </div>
      <p className="mt-4 inline-flex rounded-md bg-sage px-3 py-1 text-xs font-black uppercase tracking-wide text-leaf">{status}</p>
    </section>
  );
}
