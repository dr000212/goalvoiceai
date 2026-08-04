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
  personal_context: ""
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

  function update(name: keyof ProfileInput, value: string) {
    setDirty(true);
    setForm((current) => ({ ...current, [name]: value }));
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
