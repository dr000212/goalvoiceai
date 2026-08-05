"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, ChevronRight, FileText, Filter, Plus, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GoalCard } from "@/components/GoalCard";
import { GoalSwitcher } from "@/components/GoalSwitcher";
import { ScoreCard } from "@/components/ScoreCard";
import { InsightCard } from "@/components/InsightCard";
import { InstallPrompt } from "@/components/InstallPrompt";
import { api } from "@/lib/api";
import type { Goal } from "@/types/goal";
import type { CheckIn, DailyAnalysis } from "@/types/checkin";
import type { WeeklyReport } from "@/types/report";
import type { Profile } from "@/types/profile";

type CalendarDay = {
  date: string;
  status: "completed" | "missed" | "in_progress";
  is_today: boolean;
};

type Dashboard = {
  active_goals: Goal[];
  latest_check_in: CheckIn | null;
  latest_analysis: DailyAnalysis | null;
  current_streak: number;
  calendar_days: CalendarDay[];
  daily_reports: {
    id: string;
    date: string;
    goal_id?: string | null;
    goal_title?: string | null;
    transcript?: string;
    score?: number | null;
    mood?: string | null;
    insight?: string | null;
    next_action?: string | null;
  }[];
  weekly_average_score: number | null;
  latest_weekly_report: WeeklyReport | null;
};

function DashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <section className="card grid gap-4 p-6">
        <div className="h-5 w-36 animate-pulse rounded bg-ink/10" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
          <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-lg bg-white" />
        <div className="h-32 animate-pulse rounded-lg bg-white" />
        <div className="h-32 animate-pulse rounded-lg bg-white" />
      </div>
    </div>
  );
}

function CheckInCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-leaf">Check-in calendar</h2>
        </div>
        <div className="flex gap-3 text-[11px] font-black uppercase text-ink/60">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-leaf" aria-hidden /> Completed</span>
          <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-coral" aria-hidden /> Missed</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const date = new Date(`${day.date}T00:00:00`);
          const completed = day.status === "completed";
          const inProgress = day.status === "in_progress";
          return (
            <div
              key={day.date}
              className={`depth-tile grid min-h-20 place-items-center rounded-xl border p-2 text-center ${
                completed
                  ? "border-leaf/25 bg-sage"
                  : inProgress
                  ? "border-leaf bg-white"
                  : "border-coral/20 bg-[#fbf4ef]"
              } ${day.is_today ? "ring-2 ring-leaf ring-offset-2 ring-offset-white" : ""}`}
              title={completed ? "Completed check-in" : inProgress ? "In progress until 23:59" : "Missed check-in"}
            >
              <div>
                <p className="text-[11px] font-black uppercase text-ink/55">{date.toLocaleDateString(undefined, { weekday: "short" })}</p>
                <p className="mt-1 text-xl font-black">{date.getDate()}</p>
                <p className={`mt-1 text-[10px] font-black uppercase ${completed ? "text-leaf" : inProgress ? "text-leaf" : "text-coral"}`}>
                  {completed ? "Done" : inProgress ? "Today" : "Missed"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DailyReports({ reports }: { reports: Dashboard["daily_reports"] }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title flex items-center gap-2"><FileText className="h-6 w-6" aria-hidden /> Daily reports</h2>
        <Filter className="h-5 w-5 text-ink/65" aria-hidden />
      </div>
      <div className="mt-4 grid gap-3">
        {reports.length === 0 && <p className="soft-row p-5 text-sm text-ink/65">No daily reports yet. Submit a check-in to create your first one.</p>}
        {reports.map((report) => (
          <Link key={report.id} href={`/check-in/${report.id}/result`} className="soft-row depth-tile flex items-center justify-between gap-4 p-4 transition hover:border-leaf/30 hover:shadow-soft">
            <div className="flex min-w-0 items-center gap-4">
              <span className="depth-icon grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-leaf">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-black">{report.goal_title || "Goal check-in"}</p>
                <p className="text-xs font-semibold text-ink/50">{report.date} {report.mood ? `- ${report.mood}` : ""}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`text-lg font-black ${(report.score ?? 0) >= 60 ? "text-leaf" : "text-coral"}`}>{report.score ?? "--"}/100</span>
              <ChevronRight className="h-5 w-5 text-ink/45" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Badges({ streak, reportCount, completedGoals }: { streak: number; reportCount: number; completedGoals: number }) {
  const badges = [
    { label: "First check-in", earned: reportCount > 0 },
    { label: "3-day streak", earned: streak >= 3 },
    { label: "7-day streak", earned: streak >= 7 },
    { label: "Completed goal", earned: completedGoals > 0 }
  ];
  return (
    <section className="card p-6">
      <h2 className="section-title">Achievements</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {badges.map((badge) => (
          <div key={badge.label} className={`depth-tile rounded-2xl border p-4 text-center ${badge.earned ? "border-leaf bg-sage text-leaf" : "border-ink/10 bg-[#f5f4ef] text-ink/45"}`}>
            <p className="font-black">{badge.earned ? "Unlocked" : "Locked"}</p>
            <p className="mt-1 text-sm font-semibold">{badge.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function currentDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function streakFromReports(reports: Dashboard["daily_reports"]) {
  const dates = new Set(reports.map((report) => report.date).filter(Boolean));
  let streak = 0;
  const today = new Date();
  const cursor = new Date(today);
  if (!dates.has(currentDateKey())) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Dashboard>("/dashboard").then((dashboard) => {
      setData(dashboard);
      setSelectedGoalId((current) => current || dashboard.active_goals[0]?.id || "");
    }).catch((err) => setError(err.message));
    api.get<Profile | null>("/profile").then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (!profile?.reminder_enabled || !profile.reminder_time || !("Notification" in window) || Notification.permission !== "granted") return;
    const [hour, minute] = profile.reminder_time.split(":").map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(hour || 20, minute || 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const timeout = window.setTimeout(() => {
      new Notification("GoalVoice check-in", { body: "Choose a goal and record today's progress." });
    }, next.getTime() - now.getTime());
    return () => window.clearTimeout(timeout);
  }, [profile]);

  const selectedGoal = data?.active_goals.find((goal) => goal.id === selectedGoalId) || data?.active_goals[0];
  const selectedReports = selectedGoal
    ? data?.daily_reports.filter((report) => report.goal_id === selectedGoal.id) || []
    : data?.daily_reports || [];
  const selectedCalendarDays = data
    ? data.calendar_days.map((day) => ({
      ...day,
      status: selectedReports.some((report) => report.date === day.date)
        ? "completed" as const
        : day.date === currentDateKey()
        ? "in_progress" as const
        : "missed" as const
    }))
    : [];
  const latestSelectedReport = selectedReports[0];
  const selectedScores = selectedReports.map((report) => report.score).filter((score): score is number => score != null);
  const selectedWeeklyAverage = selectedScores.length ? Math.round(selectedScores.reduce((total, score) => total + score, 0) / selectedScores.length) : null;
  const missedYesterday = selectedGoal && !selectedReports.some((report) => report.date === yesterdayKey());

  async function completeSelectedGoal() {
    if (!selectedGoal) return;
    await api.post(`/goals/${selectedGoal.id}/complete`);
    const dashboard = await api.get<Dashboard>("/dashboard");
    setData(dashboard);
    setSelectedGoalId(dashboard.active_goals[0]?.id || "");
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-14 pt-5">
        <section className="hero-panel px-7 py-10 md:px-12 md:py-12">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-sage">Today</p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Welcome to GoalVoice"}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-white/86">
                {profile?.current_focus
                  ? `Today, keep moving toward: ${profile.current_focus}`
                  : "Pick a goal, check in, and keep your streak alive. The AI is listening."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn bg-white text-leaf" href="/check-in">
                <CalendarCheck className="h-5 w-5" aria-hidden /> Check in
              </Link>
              <Link className="btn border border-white/25 bg-white/10 text-white" href="/goals/new">
                <Plus className="h-5 w-5" aria-hidden /> Add Goal
              </Link>
            </div>
          </div>
        </section>
        {error && <p className="card p-4 text-coral">{error}</p>}
        <InstallPrompt />
        {!data ? <DashboardSkeleton /> : (
          <>
            {data.active_goals.length === 0 ? (
              <section className="card grid gap-4 p-6">
                <h2 className="text-xl font-black">Create your first goal</h2>
                <p className="text-ink/70">Add one goal, then come back every day and check in against it.</p>
                <Link className="btn btn-primary w-fit" href="/goals/new">Add Goal</Link>
              </section>
            ) : (
              <section className="grid gap-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="section-title">Current goals</h2>
                    <p className="mt-1 text-sm text-ink/65">Use the button on any goal for today's check-in.</p>
                  </div>
                  <Link className="text-sm font-bold text-leaf" href="/goals">Manage all</Link>
                </div>
                <GoalSwitcher goals={data.active_goals} selectedGoalId={selectedGoal?.id || ""} onSelect={setSelectedGoalId} />
                {selectedGoal && (
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn btn-secondary" href={`/goals/${selectedGoal.id}`}>Quick edit selected goal</Link>
                    <button className="btn btn-secondary" onClick={completeSelectedGoal} type="button">Complete selected goal</button>
                  </div>
                )}
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="grid gap-6">
                    {selectedGoal && <GoalCard key={selectedGoal.id} goal={selectedGoal} primaryAction />}
                    <section className="grid gap-4 md:grid-cols-3">
                      <ScoreCard compact score={latestSelectedReport?.score} label="Latest score" />
                      <div className="card depth-tile grid content-center p-5 text-center">
                        <p className="text-xs font-bold uppercase tracking-wide text-ink/55">Daily streak</p>
                        <p className="mt-3 text-5xl font-black text-leaf">{streakFromReports(selectedReports)}</p>
                        <p className="mt-2 text-sm text-ink/60">current streak</p>
                      </div>
                      <ScoreCard score={selectedWeeklyAverage} label="Weekly average" />
                    </section>
                  </div>
                  <aside className="grid content-start gap-5">
                    <CheckInCalendar days={selectedCalendarDays} />
                    <InsightCard title="Latest Insight" body={latestSelectedReport?.insight} />
                    <InsightCard title="Next Action Plan" body={latestSelectedReport?.next_action} tone="action" />
                    {missedYesterday && (
                      <section className="card border-l-4 border-l-coral p-6">
                        <h2 className="text-xl font-black text-coral">Restart today</h2>
                        <p className="mt-3 leading-7 text-ink/70">Yesterday has no check-in for this goal. Keep it simple: write what blocked you, then choose one tiny action for today.</p>
                        <Link className="btn btn-primary mt-5" href={`/check-in?goal=${selectedGoal.id}&title=${encodeURIComponent(selectedGoal.title)}`}>Restart with one action</Link>
                      </section>
                    )}
                  </aside>
                </div>
              </section>
            )}
            <DailyReports reports={selectedReports} />
            <Badges streak={streakFromReports(selectedReports)} reportCount={selectedReports.length} completedGoals={0} />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
