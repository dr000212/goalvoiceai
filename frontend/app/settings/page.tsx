"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Download, Edit3, LogOut, ShieldCheck, Trash2, UserRound, Waves } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "@/components/ProfileForm";
import type { Profile } from "@/types/profile";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [confirming, setConfirming] = useState<"data" | "account" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
    api.get<Profile | null>("/profile")
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoaded(true));
  }, []);

  async function deleteData() {
    const response = await api.delete<{ message: string }>("/account/data");
    setMessage(response.message);
    setConfirming(null);
  }

  async function deleteAccount() {
    const response = await api.delete<{ message: string }>("/account");
    setMessage(response.message);
    setConfirming(null);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function exportData() {
    const { data } = await supabase.auth.getSession();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiBase}/check-ins/export.csv`, {
      headers: { Authorization: `Bearer ${data.session?.access_token}` }
    });
    if (!response.ok) {
      setMessage("Could not export your data. Try again later.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "goalvoice-check-ins.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container max-w-3xl pb-16 pt-8">
        <h1 className="page-title">Settings</h1>
        <p className="mt-3 text-ink/72">Manage your account and voice profile for personalized insights.</p>
        <section className="card mt-8 grid gap-5 p-6">
          <div className="flex items-center gap-4">
            <span className="depth-icon grid h-14 w-14 place-items-center rounded-full bg-sage text-leaf">
              <UserRound className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-black">Account Details</h2>
              <p className="text-sm text-ink/65">{email || "Loading..."}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="btn btn-secondary justify-between" href="/privacy">
              <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" aria-hidden /> Privacy Policy</span>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Link>
            <button className="btn btn-secondary justify-between" onClick={logout}>
              <span className="flex items-center gap-2"><LogOut className="h-5 w-5" aria-hidden /> Logout</span>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <button className="btn btn-secondary justify-between" onClick={exportData}>
            <span className="flex items-center gap-2"><Download className="h-5 w-5" aria-hidden /> Export check-ins CSV</span>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <button className="btn btn-danger" onClick={() => setConfirming("data")}>
            <Trash2 className="h-5 w-5" aria-hidden /> Delete all my data
          </button>
          <button className="btn btn-secondary border-coral/30 text-coral" onClick={() => setConfirming("account")}>
            <Trash2 className="h-5 w-5" aria-hidden /> Delete account
          </button>
          {message && <p className="text-sm font-semibold text-leaf">{message}</p>}
        </section>
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="section-title flex items-center gap-2"><Waves className="h-6 w-6" aria-hidden /> Your profile</h2>
            {profileLoaded && profile && !editingProfile && (
              <button className="btn btn-secondary" onClick={() => setEditingProfile(true)} type="button">
                <Edit3 className="h-5 w-5" aria-hidden /> Edit
              </button>
            )}
          </div>
          {profileLoaded ? (
            editingProfile || !profile ? (
              <ProfileForm initial={profile} submitLabel={profile ? "Update profile" : "Save profile"} onSaved={(saved) => {
                setProfile(saved);
                setEditingProfile(false);
                setMessage("Profile updated.");
              }} />
            ) : (
              <section className="card grid gap-6 p-6 md:p-9">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-ink/45">Your name</p>
                  <p className="mt-2 text-3xl font-black text-leaf">{profile.display_name || "Not added"}</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="depth-tile rounded-2xl bg-[#f5f4ef] p-5">
                    <p className="font-black">What you are doing now</p>
                    <p className="mt-2 leading-7 text-ink/70">{profile.current_focus || "Not added yet."}</p>
                  </div>
                  <div className="depth-tile rounded-2xl bg-sage/35 p-5">
                    <p className="font-black">What helps you do well</p>
                    <p className="mt-2 leading-7 text-ink/70">{profile.likes || "Not added yet."}</p>
                  </div>
                  <div className="depth-tile rounded-2xl bg-[#fbf4ef] p-5">
                    <p className="font-black">What gets in your way</p>
                    <p className="mt-2 leading-7 text-ink/70">{profile.dislikes || "Not added yet."}</p>
                  </div>
                  <div className="depth-tile rounded-2xl bg-white p-5 ring-1 ring-ink/10">
                    <p className="font-black">Anything else AI should know</p>
                    <p className="mt-2 leading-7 text-ink/70">{profile.personal_context || "Not added yet."}</p>
                  </div>
                  <div className="depth-tile rounded-2xl bg-sage/35 p-5 md:col-span-2">
                    <p className="font-black">Reminder setting</p>
                    <p className="mt-2 leading-7 text-ink/70">
                      {profile.reminder_enabled ? `Daily reminder saved for ${profile.reminder_time || "20:00"}.` : "Daily reminders are off."}
                    </p>
                  </div>
                </div>
              </section>
            )
          ) : (
            <section className="card grid gap-4 p-6 md:p-9">
              <div className="h-7 w-40 animate-pulse rounded bg-ink/10" />
              <div className="h-14 animate-pulse rounded-2xl bg-ink/10" />
              <div className="h-28 animate-pulse rounded-2xl bg-ink/10" />
              <div className="h-28 animate-pulse rounded-2xl bg-ink/10" />
            </section>
          )}
        </div>
        {confirming && (
          <div className="fixed inset-0 grid place-items-center bg-ink/40 p-4">
            <section className="card max-w-md p-6">
              <h2 className="text-xl font-black">{confirming === "account" ? "Delete your account?" : "Delete all stored data?"}</h2>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                {confirming === "account"
                  ? "This removes your app data and deletes your login account. You will be signed out."
                  : "This removes goals, check-ins, analyses, reports, and profile details. You will remain logged in."}
              </p>
              <div className="mt-5 flex gap-3">
                <button className="btn btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirming === "account" ? deleteAccount : deleteData}>Confirm delete</button>
              </div>
            </section>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
