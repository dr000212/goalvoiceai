"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, PartyPopper, Plus, XCircle } from "lucide-react";
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

function Badges({ streak, reportCount, completedGoals }: { streak: number; reportCount: number; completedGoals: number }) {
  const badges = [
    { label: "First check-in", emoji: "🎙️", earned: reportCount > 0 },
    { label: "3-day streak", emoji: "🔥", earned: streak >= 3 },
    { label: "7-day streak", emoji: "🏆", earned: streak >= 7 },
    { label: "Completed goal", emoji: "✅", earned: completedGoals > 0 }
  ];
  return (
    <section className="card p-6">
      <h2 className="section-title">Achievements</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {badges.map((badge) => (
          <div key={badge.label} className={`depth-tile rounded-2xl border p-4 text-center ${badge.earned ? "border-leaf bg-sage text-leaf" : "border-ink/10 bg-[#f5f4ef] text-ink/45"}`}>
            <p className="text-4xl">{badge.emoji}</p>
            <p className="mt-3 font-black">{badge.earned ? "Unlocked" : "Locked"}</p>
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
  const hasTodayCheckIn = selectedReports.some((report) => report.date === currentDateKey());
  const missedYesterday = selectedGoal && !hasTodayCheckIn && !selectedReports.some((report) => report.date === yesterdayKey());

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
                    {selectedGoal && hasTodayCheckIn && (
                      <section className="card border-l-4 border-l-leaf p-6">
                        <div className="flex items-start gap-4">
                          <span className="depth-icon grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sage text-leaf">
                            <PartyPopper className="h-6 w-6" aria-hidden />
                          </span>
                          <div>
                            <h2 className="text-xl font-black text-leaf">Today is logged</h2>
                            <p className="mt-3 leading-7 text-ink/70">
                              Nice, this goal already has a check-in today. Open the report to review your insight, or add another note if something important changed.
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {latestSelectedReport?.id && <Link className="btn btn-primary" href={`/check-in/${latestSelectedReport.id}/result`}>View today&apos;s report</Link>}
                          <Link className="btn btn-secondary" href={`/check-in?goal=${selectedGoal.id}&title=${encodeURIComponent(selectedGoal.title)}`}>Add another note</Link>
                        </div>
                      </section>
                    )}
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
            <Badges streak={streakFromReports(selectedReports)} reportCount={selectedReports.length} completedGoals={0} />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
