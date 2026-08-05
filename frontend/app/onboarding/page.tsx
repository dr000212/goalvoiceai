"use client";

import { useRouter } from "next/navigation";
import { Mic2, Target, UserRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container max-w-3xl py-8">
        <p className="text-sm font-black uppercase tracking-wide text-leaf">Profile setup</p>
        <h1 className="mt-2 text-3xl font-black">Set up your first progress loop</h1>
        <p className="mt-2 text-ink/65">
          GoalVoice works best when your profile, first goal, and first check-in are connected.
        </p>
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { title: "Profile", icon: UserRound, active: true },
            { title: "First goal", icon: Target, active: false },
            { title: "First check-in", icon: Mic2, active: false }
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className={`depth-tile rounded-2xl border p-4 ${step.active ? "border-leaf bg-sage" : "border-ink/10 bg-white"}`}>
                <Icon className="h-5 w-5 text-leaf" aria-hidden />
                <p className="mt-3 text-sm font-black">{index + 1}. {step.title}</p>
              </div>
            );
          })}
        </section>
        <div className="mt-6">
          <ProfileForm submitLabel="Save profile and create goal" onSaved={() => router.push("/goals/new")} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
