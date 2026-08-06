"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Download,
  Edit3,
  History,
  MinusCircle,
  PauseCircle,
  Rocket,
  Save,
  Share2,
  SmilePlus,
  Sparkles,
  Volume2,
  XCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { scoreStatus } from "@/components/ScoreCard";
import { api } from "@/lib/api";
import type { CheckIn, DailyAnalysis } from "@/types/checkin";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function ReportStat({ label, value, tone = "leaf" }: { label: string; value: string; tone?: "leaf" | "coral" | "gold" }) {
  const toneClass = tone === "coral" ? "text-coral" : tone === "gold" ? "text-gold" : "text-leaf";
  return (
    <div className="depth-tile rounded-2xl border border-ink/8 bg-white p-5">
      <p className="text-xs font-black uppercase text-ink/48">{label}</p>
      <p className={`mt-3 text-3xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const safeScore = clamp(score);
  return (
    <div
      className="grid h-40 w-40 place-items-center rounded-full shadow-soft"
      style={{ background: `conic-gradient(var(--leaf) ${safeScore * 3.6}deg, #e8e5dd 0deg)` }}
      aria-label={`Daily score ${safeScore} out of 100`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
        <span className="text-3xl font-black text-leaf">{safeScore}</span>
        <span className="-mt-2 text-xs font-black uppercase text-ink/45">score</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, helper }: { label: string; value: number; helper?: string }) {
  const safeValue = clamp(value);
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm font-black">
        <span>{label}</span>
        <span>{safeValue}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-leaf" style={{ width: `${safeValue}%` }} />
      </div>
      {helper && <p className="mt-2 text-sm leading-6 text-ink/60">{helper}</p>}
    </div>
  );
}

function ActionList({
  title,
  icon,
  items,
  empty,
  tone
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
  tone: "leaf" | "ink" | "coral";
}) {
  const toneClass = tone === "coral" ? "border-l-coral text-coral" : tone === "ink" ? "border-l-ink/25 text-ink/60" : "border-l-leaf text-leaf";
  return (
    <section className={`card border-l-4 p-6 ${toneClass}`}>
      <h2 className="flex items-center gap-2 text-2xl font-black">
        {icon}
        {title}
      </h2>
      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-[#f5f4ef] p-4 text-sm font-semibold italic text-ink/55">{empty}</p>
        ) : (
          items.map((item) => (
            <p key={item} className="rounded-2xl bg-[#f5f4ef] p-4 text-base font-semibold leading-7 text-ink/76">
              {item}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

function buildReportText(analysis: DailyAnalysis, dateLabel: string) {
  const completed = analysis.completed_actions.map((item) => item.action).join(", ") || "No completed actions were clearly identified.";
  const missed = analysis.missed_actions.map((item) => item.action).join(", ") || "No missed actions were clearly identified.";
  const blockers = analysis.blockers.map((item) => item.blocker).join(", ") || "No blockers were recorded.";

  return [
    `GoalVoice daily report${dateLabel ? ` for ${dateLabel}` : ""}.`,
    `Your score is ${analysis.overall_score} out of 100, which is ${scoreStatus(analysis.overall_score)}.`,
    `Mood: ${analysis.mood || "not noted"}. Energy level: ${analysis.energy_level} out of 10.`,
    `Insight: ${analysis.insight}`,
    `Completed: ${completed}`,
    `Missed or unclear: ${missed}`,
    `Blockers: ${blockers}`,
    `Next action: ${analysis.tomorrow_action}`
  ].join(" ");
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    api.get<CheckIn>(`/check-ins/${params.id}`).then((loaded) => {
      setCheckIn(loaded);
      setDraft(loaded.transcript);
    });
  }, [params.id]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
  }, []);

  async function reanalyze() {
    setSaving(true);
    setMessage("");
    try {
      const result = await api.put<{ check_in: CheckIn; analysis: CheckIn["analysis"] }>(`/check-ins/${params.id}/reanalyze`, { transcript: draft });
      setCheckIn({ ...result.check_in, analysis: result.analysis });
      setEditing(false);
      setMessage("Updated and re-analyzed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update this report.");
    } finally {
      setSaving(false);
    }
  }

  async function shareSummary() {
    if (!analysis) return;
    const text = `GoalVoice Daily Result\nScore: ${analysis.overall_score}/100\nInsight: ${analysis.insight}\nNext: ${analysis.tomorrow_action}`;
    if (navigator.share) {
      await navigator.share({ title: "GoalVoice Daily Result", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage("Summary copied to clipboard.");
  }

  function listenToReport() {
    if (!analysis || !("speechSynthesis" in window)) {
      setMessage("Voice playback is not available in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(reportText);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  const analysis = checkIn?.analysis;
  const dateLabel = checkIn?.check_in_date
    ? new Date(`${checkIn.check_in_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
    : "";
  const reportText = useMemo(() => (analysis ? buildReportText(analysis, dateLabel) : ""), [analysis, dateLabel]);
  const completedCount = analysis?.completed_actions.length || 0;
  const missedCount = analysis?.missed_actions.length || 0;
  const blockerCount = analysis?.blockers.length || 0;
  const clarityScore = analysis ? clamp(100 - missedCount * 18 - blockerCount * 12 + completedCount * 8) : 0;

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-7 pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf/70">Daily Report</p>
            <h1 className="mt-2 text-5xl font-black leading-tight">Your Progress Story</h1>
            <p className="mt-4 text-xl text-ink/65">Simple analysis for {dateLabel || "today"}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={listenToReport} type="button" disabled={!analysis}>
              {speaking ? <PauseCircle className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
              {speaking ? "Stop voice report" : "Listen to report"}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing((value) => !value)} type="button">
              <Edit3 className="h-5 w-5" aria-hidden /> Edit
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()} type="button">
              <Download className="h-5 w-5" aria-hidden /> PDF
            </button>
            <button className="btn btn-secondary" onClick={shareSummary} type="button">
              <Share2 className="h-5 w-5" aria-hidden /> Share
            </button>
          </div>
        </div>

        {editing && (
          <section className="card grid gap-4 p-6">
            <h2 className="text-2xl font-black text-leaf">Edit transcript and re-run AI</h2>
            <textarea className="field min-h-40" value={draft} onChange={(event) => setDraft(event.target.value)} />
            {message && <p className="text-sm font-semibold text-coral">{message}</p>}
            <button className="btn btn-primary w-fit" onClick={reanalyze} disabled={saving} type="button">
              <Save className="h-5 w-5" aria-hidden /> {saving ? "Updating..." : "Save and re-analyze"}
            </button>
          </section>
        )}

        {!editing && message && <p className="card p-4 text-sm font-semibold text-leaf">{message}</p>}

        {!analysis ? <p className="card p-6">Preparing your analysis...</p> : (
          <>
            <section className="card overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[0.85fr_1fr]">
                <div className="bg-leaf p-8 text-white">
                  <div className="flex flex-wrap items-center gap-7">
                    <ScoreRing score={analysis.overall_score} />
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-sage">Today's Goal Score</p>
                      <p className="mt-4 text-5xl font-black">{analysis.overall_score}/100</p>
                      <span className="pill mt-4 bg-white text-leaf">{scoreStatus(analysis.overall_score)}</span>
                    </div>
                  </div>
                  <p className="mt-7 text-lg font-semibold leading-8 text-white/82">{analysis.insight}</p>
                </div>
                <div className="grid gap-5 p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="section-title flex items-center gap-2 text-2xl"><BarChart3 className="h-6 w-6" aria-hidden /> Quick charts</h2>
                    <span className="pill bg-sage text-leaf">Journal synchronized</span>
                  </div>
                  <ProgressBar label="Goal progress" value={analysis.overall_score} helper="How strongly today's check-in moved the selected goal forward." />
                  <ProgressBar label="Report clarity" value={clarityScore} helper="Higher when the check-in has completed work, fewer unclear misses, and fewer blockers." />
                  <div>
                    <div className="mb-2 flex justify-between text-sm font-black">
                      <span>Energy level</span>
                      <span>{analysis.energy_level}/10</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${clamp((analysis.energy_level || 0) * 10)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <ReportStat label="Completed" value={`${completedCount}`} />
              <ReportStat label="Missed" value={`${missedCount}`} tone={missedCount > 0 ? "coral" : "leaf"} />
              <ReportStat label="Blockers" value={`${blockerCount}`} tone={blockerCount > 0 ? "gold" : "leaf"} />
              <ReportStat label="Energy" value={`${analysis.energy_level}/10`} tone="gold" />
            </section>

            <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
              <section className="card p-7">
                <h2 className="flex items-center gap-3 text-lg font-black text-ink/72"><Sparkles className="h-6 w-6 text-leaf" aria-hidden /> Simple Analysis</h2>
                <p className="mt-5 text-xl leading-9 text-ink/80">{analysis.insight}</p>
              </section>
              <section className="card !border-leaf !bg-leaf p-8 !text-white">
                <div className="flex items-start gap-5">
                  <span className="depth-icon grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/15">
                    <Rocket className="h-8 w-8 text-white" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/70">Next best action</p>
                    <p className="mt-4 text-2xl font-black leading-snug !text-white">
                      {analysis.tomorrow_action || "No next action was created yet. Re-run the analysis or add more detail to your check-in."}
                    </p>
                  </div>
                </div>
                <Link href="/check-in" className="btn mt-6 !bg-white !text-leaf">
                  Add to Calendar <CalendarPlus className="h-5 w-5" aria-hidden />
                </Link>
              </section>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <ActionList
                title="Completed"
                icon={<CheckCircle2 className="h-7 w-7" aria-hidden />}
                items={analysis.completed_actions.map((item) => item.action)}
                empty="No completed actions were identified."
                tone="leaf"
              />
              <ActionList
                title="Missed"
                icon={<XCircle className="h-7 w-7" aria-hidden />}
                items={analysis.missed_actions.map((item) => item.action)}
                empty="No missed actions were identified."
                tone="ink"
              />
              <ActionList
                title="Blockers"
                icon={<MinusCircle className="h-7 w-7" aria-hidden />}
                items={analysis.blockers.map((item) => item.blocker)}
                empty="No blockers recorded."
                tone="coral"
              />
            </div>

            <section className="card p-7">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-black tracking-wide text-ink/70">Goal Scores Breakdown</h2>
                <History className="h-6 w-6 text-ink/50" aria-hidden />
              </div>
              <div className="mt-6 grid gap-4">
                {analysis.goal_scores.map((goal) => (
                  <div key={goal.goal_id} className="depth-tile rounded-2xl border border-ink/8 bg-white p-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
                      <div>
                        <p className="text-xl font-black">
                          {goal.goal_title} <span className="ml-2 text-leaf">{goal.score}/100</span>
                        </p>
                        <p className="mt-3 text-base leading-7 text-ink/65">{goal.reason}</p>
                      </div>
                      <ProgressBar label={scoreStatus(goal.score)} value={goal.score} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
