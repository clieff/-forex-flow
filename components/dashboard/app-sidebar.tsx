"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileText,
  History,
  LayoutDashboard,
  List,
  LogOut,
  Settings,
  Truck,
  Users,
  Wallet
} from "lucide-react";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const icons = {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  BarChart3,
  Settings,
  Boxes,
  Truck,
  Users,
  Wallet,
  FileText,
  List
};

export function AppSidebar({
  role,
  userName
}: {
  role: Role;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar sticky top-6 flex h-[calc(100vh-3rem)] w-full max-w-[280px] flex-col justify-between rounded-[30px] border border-white/10 p-5 shadow-panel">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gradient text-lg font-bold text-slate-950">
              FX
              <span className="absolute inset-0 animate-pulseRing rounded-2xl border border-forex-mint/50" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-premium text-forex-muted">ForexFlow Pro</p>
              <h1 className="text-lg font-semibold text-forex-text">Ops Exchange Suite</h1>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-premium text-forex-muted">Session active</p>
            <p className="mt-2 text-base font-semibold text-white">{userName}</p>
            <p className="mt-1 text-sm text-forex-muted">{role === "ADMIN" ? "Administrator" : "Trading Agent"}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.filter((item) => !item.role || item.role === role).map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300",
                  active
                    ? "border-forex-mint/40 bg-gradient-to-r from-forex-mint/15 to-forex-lagoon/15 text-white shadow-highlight"
                    : "border-transparent bg-white/[0.02] text-forex-muted hover:border-white/10 hover:bg-white/[0.05] hover:text-forex-text"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-forex-mint")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Button
        variant="secondary"
        className="w-full justify-between"
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
      >
        Sign out
        <LogOut className="h-4 w-4" />
      </Button>
    </aside>
  );
}
