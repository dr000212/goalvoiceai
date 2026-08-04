"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sprout } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else if (data.session) {
      router.push("/onboarding");
    } else {
      setMessage("Account created. Check your email to confirm your account, then login.");
    }
  }

  return (
    <main className="container grid min-h-screen content-center py-8">
      <section className="card mx-auto w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-2 text-leaf">
          <Sprout className="h-7 w-7" aria-hidden />
          <span className="brand-type text-2xl font-black">GoalVoice AI</span>
        </div>
        <h1 className="page-title text-4xl">Create account</h1>
        <p className="mt-3 text-sm text-ink/65">Start with email, then add your profile so the AI understands you.</p>
        <div className="mt-6 grid gap-4">
          <input className="field" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="field" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {message && <p className="text-sm font-semibold text-coral">{message}</p>}
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
          <Link className="text-center text-sm font-bold text-leaf" href="/login">I already have an account</Link>
        </div>
      </section>
    </main>
  );
}
