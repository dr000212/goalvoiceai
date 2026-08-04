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

  return (
    <section className={`card p-6 ${dark ? "border-leaf bg-leaf text-white" : "border-l-4 border-l-leaf"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${dark ? "text-sage" : "text-gold"}`} aria-hidden />
        <h3 className="font-black tracking-wide">{title}</h3>
      </div>
      {subtitle && <p className={`mt-2 text-sm font-semibold ${dark ? "text-white/60" : "text-ink/50"}`}>{subtitle}</p>}
      <p className={`mt-4 text-base leading-7 ${dark ? "text-white/82" : "text-ink/78"}`}>{body || "No insight yet. Submit a check-in to create a detailed report."}</p>
    </section>
  );
}
