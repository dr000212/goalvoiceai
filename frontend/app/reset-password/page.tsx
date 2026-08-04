"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Sprout } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Open this page from your password reset email, then enter a new password.");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      if (data.session) setMessage("Enter your new password below.");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("Enter your new password below.");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (password.length < 8) {
      setMessage("Password should be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password updated. You can login with your new password now.");
  }

  return (
    <main className="container grid min-h-screen content-center py-8">
      <section className="card mx-auto w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-2 text-leaf">
          <Sprout className="h-7 w-7" aria-hidden />
          <span className="brand-type text-2xl font-black">GoalVoice AI</span>
        </div>
        <h1 className="page-title text-4xl">Create new password</h1>
        <p className="mt-3 text-sm text-ink/65">{message}</p>
        <div className="mt-6 grid gap-4">
          <input className="field" placeholder="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready} />
          <input className="field" placeholder="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!ready} />
          <button className="btn btn-primary" onClick={submit} disabled={!ready || loading} type="button">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> {loading ? "Updating..." : "Update password"}
          </button>
          <Link className="text-center text-sm font-bold text-leaf" href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
