"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

type AdminStatus = {
  status: string;
  counts: Record<string, number>;
};

export default function AdminPage() {
  const [data, setData] = useState<AdminStatus | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get<AdminStatus>("/admin/status").then(setData).catch((err) => setMessage(err.message));
  }, []);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container grid gap-6 pb-16 pt-8">
        <div>
          <h1 className="page-title">Admin status</h1>
          <p className="mt-3 text-ink/65">Basic production counts for the GoalVoice backend.</p>
        </div>
        {message && <p className="card p-5 text-coral">{message}</p>}
        {data && (
          <section className="grid gap-4 md:grid-cols-3">
            {Object.entries(data.counts).map(([key, value]) => (
              <div key={key} className="card depth-tile p-5">
                <p className="text-xs font-black uppercase tracking-wide text-ink/50">{key.replaceAll("_", " ")}</p>
                <p className="mt-3 text-4xl font-black text-leaf">{value}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
