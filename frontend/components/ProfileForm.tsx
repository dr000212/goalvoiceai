"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import type { Profile, ProfileInput } from "@/types/profile";

const emptyProfile: ProfileInput = {
  display_name: "",
  current_focus: "",
  likes: "",
  dislikes: "",
  personal_context: "",
  reminder_time: "20:00",
  reminder_enabled: false
};

export function ProfileForm({
  initial,
  submitLabel = "Save profile",
  onSaved
}: {
  initial?: Partial<ProfileInput> | null;
  submitLabel?: string;
  onSaved?: (profile: Profile) => void;
}) {
  const [form, setForm] = useState<ProfileInput>({ ...emptyProfile, ...(initial || {}) });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!initial || dirty) return;
    setForm({ ...emptyProfile, ...initial });
  }, [initial, dirty]);

  function update(name: keyof ProfileInput, value: string | boolean) {
    setDirty(true);
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function enableReminder(enabled: boolean) {
    if (enabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    update("reminder_enabled", enabled);
  }

  async function submit() {
    if (!form.display_name.trim()) {
      setError("Add your name so the app can personalize your experience.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const saved = await api.put<Profile>("/profile", form);
      setDirty(false);
      setForm({ ...emptyProfile, ...saved });
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card grid gap-8 p-6 md:p-9">
      <label className="grid gap-2">
        <span className="text-2xl font-black">Your name</span>
        <span className="text-sm text-ink/60">This is how GoalVoice speaks to you in the app.</span>
        <input className="field" value={form.display_name} onChange={(event) => update("display_name", event.target.value)} placeholder="Example: Pradeep" />
      </label>
      <label className="grid gap-2">
        <span className="text-2xl font-black">What are you doing now?</span>
        <span className="text-sm text-ink/60">Use simple words. Example: I am studying AI engineering and applying for jobs.</span>
        <textarea className="field min-h-24" value={form.current_focus} onChange={(event) => update("current_focus", event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span className="text-2xl font-black">What helps you do well?</span>
        <span className="text-sm text-ink/60">Things you like, routines that work, or motivation style that helps you.</span>
        <textarea className="field min-h-24" value={form.likes} onChange={(event) => update("likes", event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span className="text-2xl font-black">What usually gets in your way?</span>
        <span className="text-sm text-ink/60">Things you dislike, distractions, weak points, or habits you want to improve.</span>
        <textarea className="field min-h-24" value={form.dislikes} onChange={(event) => update("dislikes", event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span className="text-2xl font-black">Anything else the AI should know?</span>
        <span className="text-sm text-ink/60">Optional. Add your preferred tone, schedule, goals, or personal context.</span>
        <textarea className="field min-h-28" value={form.personal_context} onChange={(event) => update("personal_context", event.target.value)} />
      </label>
      <div className="grid gap-4 rounded-2xl border border-leaf/15 bg-sage/25 p-5 md:grid-cols-[1fr_180px] md:items-center">
        <label className="flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5 accent-[#14422c]"
            type="checkbox"
            checked={form.reminder_enabled}
            onChange={(event) => enableReminder(event.target.checked)}
          />
          <span>
            <span className="block text-xl font-black">Daily reminder</span>
            <span className="mt-1 block text-sm leading-6 text-ink/65">Save the time you want GoalVoice to remind you. Browser/email scheduling needs production notification setup.</span>
          </span>
        </label>
        <input className="field" type="time" value={form.reminder_time || "20:00"} onChange={(event) => update("reminder_time", event.target.value)} />
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-sage/45 p-4 text-sm leading-6 text-leaf">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        Add your name and simple context so the AI can write advice that sounds personal and useful.
      </p>
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}
      <button className="btn btn-primary min-h-14 text-xl" onClick={submit} disabled={loading} type="button">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        {loading ? "Saving..." : submitLabel}
      </button>
    </section>
  );
}
