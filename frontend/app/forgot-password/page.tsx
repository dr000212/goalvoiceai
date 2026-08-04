"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Sprout } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }
    setLoading(true);
    setMessage("");
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password reset link sent. Check your email and open the link.");
  }

  return (
    <main className="container grid min-h-screen content-center py-8">
      <section className="card mx-auto w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-2 text-leaf">
          <Sprout className="h-7 w-7" aria-hidden />
          <span className="brand-type text-2xl font-black">GoalVoice AI</span>
        </div>
        <h1 className="page-title text-4xl">Reset password</h1>
        <p className="mt-3 text-sm text-ink/65">Enter your account email. We will send a link to create a new password.</p>
        <div className="mt-6 grid gap-4">
          <input className="field" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {message && <p className="text-sm font-semibold text-coral">{message}</p>}
          <button className="btn btn-primary" onClick={submit} disabled={loading} type="button">
            <Mail className="h-5 w-5" aria-hidden /> {loading ? "Sending..." : "Send reset link"}
          </button>
          <Link className="text-center text-sm font-bold text-leaf" href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
