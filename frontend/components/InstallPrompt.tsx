"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (installEvent: Event) => {
      installEvent.preventDefault();
      setEvent(installEvent as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!event || dismissed) return null;

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setDismissed(true);
    setEvent(null);
  }

  return (
    <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <h2 className="text-xl font-black text-leaf">Install GoalVoice</h2>
        <p className="mt-1 text-sm text-ink/65">Add it to your device for a faster app-like check-in flow.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={install} type="button"><Download className="h-5 w-5" aria-hidden /> Install</button>
        <button className="btn btn-secondary" onClick={() => setDismissed(true)} type="button">Later</button>
      </div>
    </section>
  );
}
