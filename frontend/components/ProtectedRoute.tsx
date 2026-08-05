"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session) {
        setReady(true);
        return;
      }
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <main className="container grid min-h-screen content-center py-10">
        <section className="card mx-auto grid w-full max-w-md justify-items-center gap-5 p-8 text-center">
          <div className="depth-icon h-16 w-16 animate-pulse rounded-full bg-sage" />
          <div>
            <h1 className="text-2xl font-black text-leaf">Opening your workspace</h1>
            <p className="mt-2 text-sm text-ink/65">Checking your saved login session.</p>
          </div>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}
