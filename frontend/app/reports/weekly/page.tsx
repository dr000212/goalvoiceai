"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, FileText, Lock, Sparkles, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GoalSwitcher } from "@/components/GoalSwitcher";
import { WeeklyReportCard } from "@/components/WeeklyReportCard";
import { api } from "@/lib/api";
import type { CheckIn } from "@/types/checkin";
import type { Goal } from "@/types/goal";
import type { WeeklyReport } from "@/types/report";

type CalendarDay = {
  date: string;
  label: string;
  dayNumber: number;
  status: "completed" | "missed" | "today";
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildCalendarDays(checkIns: CheckIn[]): CalendarDay[] {
  const checkedDates = new Set(checkIns.map((item) => item.check_in_date).filter(Boolean));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    return {
      date: key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: date.getDate(),
      status: checkedDates.has(key) ? "completed" : key === dateKey(today) ? "today" : "missed"
    };
  });
}

export default function WeeklyReportsPage() {
  const [latest, setLatest] = useState<WeeklyReport | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [latestReport, allReports, allCheckIns, allGoals] = await Promise.all([
      api.get<WeeklyReport | null>("/reports/weekly/latest"),
      api.get<WeeklyReport[]>("/reports/weekly"),
      api.get<CheckIn[]>("/check-ins"),
      api.get<Goal[]>("/goals")
    ]);
    setLatest(latestReport);
    setReports(allReports);
    setCheckIns(allCheckIns);
    setGoals(allGoals);
    setSelectedGoalId((current) => current || allGoals[0]?.id || "");
    setSelectedDate((current) => current || allCheckIns[0]?.check_in_date || dateKey(new Date()));
  }

  useEffect(() => {
    load().catch((err) => setNotice(err.message));
  }, []);

  async function generate() {
    if (!weeklyUnlocked) return;
    setLoading(true);
    setNotice("");
    try {
      const report = await api.post<WeeklyReport>("/reports/weekly/generate");
      setLatest(report);
      await load();
      setNotice("This report is based on your available check-ins so far.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not generate report.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCheckIns = selectedGoalId ? checkIns.filter((item) => item.goal_id === selectedGoalId) : checkIns;
  const calendarDays = buildCalendarDays(filteredCheckIns);
  const uniqueCheckInDays = new Set(filteredCheckIns.map((item) => item.check_in_date).filter(Boolean)).size;
  const weeklyUnlocked = uniqueCheckInDays >= 7;
  const selectedReports = filteredCheckIns.filter((item) => item.check_in_date === selectedDate);
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
    : "Selected day";

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-16 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Insights</h1>
            <p className="mt-3 text-ink/65">Daily reports come first. Weekly report unlocks after 7 checked-in days.</p>
          </div>
        </div>
        {notice && <p className="card p-4 text-sm text-ink/72">{notice}</p>}

        <GoalSwitcher goals={goals} selectedGoalId={selectedGoalId} onSelect={(goalId) => {
          setSelectedGoalId(goalId);
          const firstForGoal = checkIns.find((item) => item.goal_id === goalId);
          setSelectedDate(firstForGoal?.check_in_date || dateKey(new Date()));
        }} />

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title flex items-center gap-2"><CalendarDays className="h-6 w-6" aria-hidden /> Daily reports</h2>
              <p className="mt-1 text-sm text-ink/65">Click a date to open the reports saved for that day.</p>
            </div>
            <div className="flex gap-3 text-[11px] font-black uppercase text-ink/60">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-leaf" aria-hidden /> Completed</span>
              <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-coral" aria-hidden /> Missed</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const active = selectedDate === day.date;
              return (
                <button
                  key={day.date}
                  className={`depth-tile grid min-h-20 place-items-center rounded-xl border p-2 text-center transition ${
                    day.status === "completed"
                      ? "border-leaf/25 bg-sage"
                      : day.status === "today"
                      ? "border-leaf bg-white"
                      : "border-coral/20 bg-[#fbf4ef]"
                  } ${active ? "ring-2 ring-leaf ring-offset-2 ring-offset-white" : ""}`}
                  onClick={() => setSelectedDate(day.date)}
                  type="button"
                >
                  <span>
                    <span className="block text-[11px] font-black uppercase text-ink/55">{day.label}</span>
                    <span className="mt-1 block text-xl font-black">{day.dayNumber}</span>
                    <span className={`mt-1 block text-[10px] font-black uppercase ${day.status === "missed" ? "text-coral" : "text-leaf"}`}>
                      {day.status === "completed" ? "Done" : day.status === "today" ? "Today" : "Missed"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-3">
            <h3 className="text-xl font-black">{selectedDateLabel}</h3>
            {selectedReports.length === 0 && (
              <p className="rounded-2xl bg-[#f5f4ef] p-5 text-sm text-ink/65">No daily report for this date yet.</p>
            )}
            {selectedReports.map((item) => (
              <Link key={item.id} href={`/check-in/${item.id}/result`} className="soft-row depth-tile flex items-center justify-between gap-4 p-4 transition hover:border-leaf/30 hover:shadow-soft">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="depth-icon grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-leaf">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-black">{item.analysis?.goal_scores?.[0]?.goal_title || "Daily check-in"}</p>
                    <p className="line-clamp-1 text-sm text-ink/60">{item.analysis?.insight || item.transcript}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`text-lg font-black ${(item.analysis?.overall_score ?? 0) >= 60 ? "text-leaf" : "text-coral"}`}>{item.analysis?.overall_score ?? "--"}/100</span>
                  <ChevronRight className="h-5 w-5 text-ink/45" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2"><Sparkles className="h-6 w-6" aria-hidden /> Weekly report</h2>
            <p className="mt-1 text-sm text-ink/65">Unlocks after 7 different days with check-ins.</p>
          </div>

          {!weeklyUnlocked ? (
            <section className="card grid gap-4 border-dashed p-7">
              <div className="flex items-start gap-4">
                <span className="depth-icon grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f5f4ef] text-leaf">
                  <Lock className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-2xl font-black">Weekly report locked</h3>
                  <p className="mt-2 leading-7 text-ink/70">
                    You have checked in on {uniqueCheckInDays}/7 days. Keep doing daily check-ins; the weekly report will unlock when you reach 7 days.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <>
              <button className="btn btn-primary w-fit" onClick={generate} disabled={loading}>{loading ? "Generating..." : "Generate weekly report"}</button>
              {latest ? <WeeklyReportCard report={latest} /> : <p className="card p-5">Weekly report unlocked. Generate your first weekly report.</p>}
            </>
          )}

          {weeklyUnlocked && reports.length > 0 && (
            <section className="grid gap-3">
              <h3 className="text-xl font-black">Previous weekly reports</h3>
              {reports.map((report) => <div key={report.id} className="soft-row depth-tile p-4 text-sm">{report.week_start_date} to {report.week_end_date}: <strong>{report.overall_week_score}/100</strong></div>)}
            </section>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
