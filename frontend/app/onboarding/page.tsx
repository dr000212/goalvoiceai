"use client";

import { useRouter } from "next/navigation";
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
        <h1 className="mt-2 text-3xl font-black">Help GoalVoice understand you</h1>
        <p className="mt-2 text-ink/65">
          Add a few simple details so your daily and weekly reports can feel more useful and personal.
        </p>
        <div className="mt-6">
          <ProfileForm submitLabel="Finish setup" onSaved={() => router.push("/dashboard")} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
