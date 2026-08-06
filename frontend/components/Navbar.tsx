"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Mic2, Settings, Sprout, UserCircle } from "lucide-react";
import { logout } from "@/lib/auth";
import { BottomNav } from "./BottomNav";

export function Navbar() {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/reports/weekly", label: "Insights" },
    { href: "/goals", label: "Goals" }
  ];

  return (
    <header className="bg-transparent">
      <nav className="container flex min-h-20 items-center justify-between gap-4 py-4">
        <Link href="/dashboard" className="brand-type flex shrink-0 items-center gap-2 text-xl font-black text-leaf">
          <Sprout className="h-6 w-6" aria-hidden />
          GoalVoice AI
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.href === "/dashboard" && pathname === "/") || (link.href === "/goals" && pathname.startsWith("/goals"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-1 text-sm font-semibold tracking-wide transition ${
                  active ? "border-leaf text-leaf" : "border-transparent text-ink hover:text-leaf"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/check-in" className="depth-icon grid h-11 w-11 place-items-center rounded-full bg-white/75 text-leaf transition hover:bg-sage/45" title="Voice check-in">
            <Mic2 className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/settings" className="depth-icon grid h-11 w-11 place-items-center rounded-full bg-white/75 text-leaf transition hover:bg-sage/45 md:hidden" title="Settings">
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/settings" className="hidden h-11 w-11 place-items-center rounded-full text-leaf transition hover:bg-sage/45 md:grid" title="Account">
            <UserCircle className="h-6 w-6" aria-hidden />
          </Link>
          <button onClick={logout} className="depth-icon grid h-11 w-11 place-items-center rounded-full bg-white/75 text-leaf transition hover:bg-sage/45" title="Logout">
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </nav>
      <div className="container flex gap-2 overflow-x-auto pb-2 md:hidden">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/dashboard" && pathname === "/") || (link.href === "/goals" && pathname.startsWith("/goals"));
          return (
            <Link key={link.href} href={link.href} className={`pill ${active ? "bg-leaf text-white" : "bg-white text-leaf"}`}>
              {link.label}
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </header>
  );
}
