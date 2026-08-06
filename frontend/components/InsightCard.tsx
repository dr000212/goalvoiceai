import { Lightbulb, Rocket } from "lucide-react";

export function InsightCard({
  title,
  body,
  subtitle,
  tone = "insight"
}: {
  title: string;
  body?: string | null;
  subtitle?: string;
  tone?: "insight" | "action";
}) {
  const Icon = tone === "action" ? Rocket : Lightbulb;
  const dark = tone === "action";
  const fallback = tone === "action"
    ? "No next action yet. Submit a check-in and GoalVoice will give you a specific next step."
    : "No insight yet. Submit a check-in to create a detailed report.";

  return (
    <section className={`card min-h-44 p-6 ${dark ? "!border-leaf !bg-leaf !text-white" : "border-l-4 border-l-leaf"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${dark ? "text-sage" : "text-gold"}`} aria-hidden />
        <h3 className="font-black tracking-wide">{title}</h3>
      </div>
      {subtitle && <p className={`mt-2 text-sm font-semibold ${dark ? "text-white/60" : "text-ink/50"}`}>{subtitle}</p>}
      <p className={`mt-4 text-base font-semibold leading-7 ${dark ? "!text-white" : "text-ink/78"}`}>{body || fallback}</p>
    </section>
  );
}
