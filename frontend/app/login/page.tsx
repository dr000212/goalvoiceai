"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sprout } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    else {
      try {
        const profile = await api.get("/profile");
        router.push(profile ? "/dashboard" : "/onboarding");
      } catch {
        router.push("/dashboard");
      }
    }
  }

  return (
    <main className="container grid min-h-screen content-center py-8">
      <section className="card mx-auto w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-2 text-leaf">
          <Sprout className="h-7 w-7" aria-hidden />
          <span className="brand-type text-2xl font-black">GoalVoice AI</span>
        </div>
        <h1 className="page-title text-4xl">Login</h1>
        <p className="mt-3 text-sm text-ink/65">Continue your daily accountability journal.</p>
        <div className="mt-6 grid gap-4">
          <input className="field" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="field" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Link className="text-right text-sm font-bold text-leaf" href="/forgot-password">Forgot password?</Link>
          {error && <p className="text-sm font-semibold text-coral">{error}</p>}
          <button className="btn btn-primary" onClick={submit}>Login</button>
          <Link className="text-center text-sm font-bold text-leaf" href="/signup">Create an account</Link>
        </div>
      </section>
    </main>
  );
}
