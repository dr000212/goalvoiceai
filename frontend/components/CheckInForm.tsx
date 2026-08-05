"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Coffee, Send } from "lucide-react";
import { api } from "@/lib/api";
import { GoalSwitcher } from "./GoalSwitcher";
import { VoiceRecorder } from "./VoiceRecorder";
import type { CheckIn } from "@/types/checkin";
import type { Goal } from "@/types/goal";

export function CheckInForm() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transcript, setTranscript] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [goalId, setGoalId] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [pendingChoice, setPendingChoice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("goal");
    const title = params.get("title");
    if (id) setGoalId(id);
    if (title) setGoalTitle(title);
  }, []);

  useEffect(() => {
    api.get<Goal[]>("/goals")
      .then((items) => {
        const activeGoals = items.filter((goal) => goal.status === "active");
        setGoals(activeGoals);
        if (!goalId && activeGoals[0]) {
          setGoalId(activeGoals[0].id);
          setGoalTitle(activeGoals[0].title);
        }
      })
      .catch(() => setGoals([]));
  }, [goalId]);

  function selectGoal(id: string) {
    const goal = goals.find((item) => item.id === id);
    setGoalId(id);
    setGoalTitle(goal?.title || "");
    setTodayCheckIns([]);
    setPendingChoice(false);
    setError("");
  }

  useEffect(() => {
    if (!goalId) return;
    api.get<CheckIn[]>(`/check-ins?goal_id=${goalId}`)
      .then((items) => {
        const today = new Date().toISOString().slice(0, 10);
        setTodayCheckIns(items.filter((item) => item.check_in_date === today));
      })
      .catch(() => setTodayCheckIns([]));
  }, [goalId]);

  async function submit(replaceToday = false) {
    if (!transcript.trim()) {
      setError("Add a check-in before requesting analysis.");
      return;
    }
    if (!goalId) {
      setError("Choose a goal before submitting your check-in.");
      return;
    }
    if (todayCheckIns.length > 0 && !replaceToday && !pendingChoice) {
      setPendingChoice(true);
      return;
    }
    setLoading(true);
    setPendingChoice(false);
    setError("");
    try {
      const finalTranscript = `Goal focus: ${goalTitle}\n\n${transcript}`;
      const result = await api.post<{ check_in: { id: string } }>("/check-ins/analyze", {
        transcript: finalTranscript,
        input_type: inputType,
        goal_id: goalId,
        replace_today: replaceToday
      });
      router.push(`/check-in/${result.check_in.id}/result`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveRestDay() {
    setInputType("text");
    setTranscript("Planned rest day. I intentionally kept this goal light today and will restart with a small action tomorrow.");
  }

  const qualitySignals = [
    transcript.trim().length >= 40,
    /completed|done|finished|studied|applied|built|worked|sent|created/i.test(transcript),
    /missed|stuck|blocked|struggled|could not|didn't|did not/i.test(transcript),
    /tomorrow|next|plan|will|morning|evening|minutes|hour/i.test(transcript)
  ];
  const qualityScore = qualitySignals.filter(Boolean).length;
  const followUpPrompts = [
    "What exactly did you complete?",
    "What did you miss or avoid?",
    "What blocked you?",
    "What is tomorrow's smallest next action?"
  ].filter((_, index) => !qualitySignals[index]);

  return (
    <div className="grid gap-4">
      {goals.length === 0 ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink/75">
          Add a goal first. Every check-in must belong to one goal.
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="font-black text-leaf">Choose goal for this check-in</p>
          <GoalSwitcher goals={goals} selectedGoalId={goalId} onSelect={selectGoal} />
        </div>
      )}
      <div className="flex rounded-2xl border border-ink/10 bg-[#efede7] p-1">
        <button className={`btn flex-1 ${inputType === "text" ? "btn-primary" : "btn-secondary"}`} onClick={() => setInputType("text")} type="button">Type</button>
        <button className={`btn flex-1 ${inputType === "voice" ? "btn-primary" : "btn-secondary"}`} onClick={() => setInputType("voice")} type="button">Voice</button>
      </div>
      {inputType === "voice" && <VoiceRecorder onTranscript={setTranscript} />}
      <div className="rounded-2xl border border-leaf/20 bg-sage/35 p-4">
        <p className="text-sm font-semibold text-ink/60">Checking in for</p>
        <p className="mt-1 text-lg font-black">{goalTitle || "Choose a goal"}</p>
      </div>
      <div className="grid gap-3 rounded-2xl bg-[#f5f4ef] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-black text-leaf">Check-in quality</p>
          <span className="pill bg-white text-leaf">{qualityScore}/4 clear</span>
        </div>
        {followUpPrompts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {followUpPrompts.map((prompt) => (
              <button key={prompt} className="pill bg-white text-ink/70" onClick={() => setTranscript((current) => `${current}${current ? "\n" : ""}${prompt} `)} type="button">
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-leaf">Good detail. The AI has enough context for a stronger report.</p>
        )}
      </div>
      <label className="grid gap-2">
        <span className="font-black text-leaf">What did you do today for this goal? What did you complete, miss, or feel stuck on?</span>
        <textarea className="field min-h-48" value={transcript} onChange={(event) => setTranscript(event.target.value)} />
      </label>
      <button className="btn btn-secondary w-fit" onClick={saveRestDay} type="button">
        <Coffee className="h-5 w-5" aria-hidden /> Planned rest day
      </button>
      {todayCheckIns.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink/75">
          You already checked in for this goal today. Submitting again can replace today's previous check-in or save another one separately.
        </div>
      )}
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}
      <button className="btn btn-primary min-h-14" onClick={() => submit(false)} disabled={loading || goals.length === 0} type="button">
        <Send className="h-4 w-4" aria-hidden /> {loading ? "Analyzing..." : "Submit for AI analysis"}
      </button>
      {pendingChoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4">
          <section className="card max-w-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-6 w-6 text-gold" aria-hidden />
              <div>
                <h2 className="text-xl font-black">You already checked in today</h2>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  Do you want to replace today's previous check-in for this goal, or save this as another check-in for the same day?
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button className="btn btn-secondary" onClick={() => setPendingChoice(false)} type="button">Cancel</button>
              <button className="btn btn-secondary" onClick={() => submit(false)} type="button">Save separately</button>
              <button className="btn btn-primary" onClick={() => submit(true)} type="button">Replace today</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
