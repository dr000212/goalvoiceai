import type { WeeklyReport } from "@/types/report";
import { ScoreCard } from "./ScoreCard";

export function WeeklyReportCard({ report, compact = false }: { report: WeeklyReport; compact?: boolean }) {
  return (
    <section className="grid gap-4">
      <ScoreCard score={report.overall_week_score} label="Weekly score" />
      <article className="card p-7">
        <h3 className="section-title">Weekly summary</h3>
        <p className="mt-4 text-lg leading-8 text-ink/72">{report.summary}</p>
        {!compact && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="depth-tile rounded-2xl border border-coral/20 bg-white p-5">
              <p className="font-black text-coral">Repeated blockers</p>
              <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-ink/72">{report.repeated_blockers.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="depth-tile rounded-2xl border border-leaf/20 bg-sage/30 p-5">
              <p className="font-black text-leaf">Next week</p>
              <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-ink/72">{report.next_week_recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
