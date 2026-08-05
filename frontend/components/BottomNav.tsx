"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Mic2, PlusCircle, UserCircle } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/reports/weekly", label: "Insights", icon: BarChart3 },
  { href: "/check-in", label: "Check in", icon: Mic2 },
  { href: "/goals/new", label: "Goal", icon: PlusCircle },
  { href: "/settings", label: "Profile", icon: UserCircle }
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-ink/10 bg-white/92 p-2 shadow-soft backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`grid justify-items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black ${active ? "bg-leaf text-white" : "text-leaf"}`}>
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
