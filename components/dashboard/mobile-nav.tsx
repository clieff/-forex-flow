"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileText,
  History,
  LayoutDashboard,
  List,
  Plus,
  Settings,
  Truck,
  Users,
  Wallet
} from "lucide-react";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <>
      {/* Scrollable nav pour tablettes (md à xl) */}
      <div className="hidden md:block xl:hidden">
        <div className="flex gap-3 overflow-x-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-3">
          {NAV_ITEMS.filter((item) => !item.role || item.role === role).map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "flex min-w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-forex-mint/40 bg-gradient-to-r from-forex-mint/15 to-forex-lagoon/15 text-white"
                    : "border-white/10 bg-white/[0.02] text-forex-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar pour Mobile (jusqu'à md) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0F1A]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-between px-6 py-3 relative">
          <Link href={"/" as any} className={cn("flex flex-col items-center gap-1", pathname === "/" ? "text-forex-mint" : "text-forex-muted")}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Accueil</span>
          </Link>
          <Link href={"/transactions" as any} className={cn("flex flex-col items-center gap-1", pathname === "/transactions" ? "text-forex-mint" : "text-forex-muted")}>
            <List className="h-5 w-5" />
            <span className="text-[10px]">Historique</span>
          </Link>
          
          {/* Floating Action Button (Nouvelle Tx) */}
          <div className="relative -top-6">
            <Link href={"/transactions/new" as any} className="flex h-14 w-14 items-center justify-center rounded-full bg-forex-mint text-[#0A0F1A] shadow-[0_0_20px_rgba(125,237,220,0.4)] transition active:scale-95">
              <Plus className="h-6 w-6" />
            </Link>
          </div>

          <Link href={"/caisse" as any} className={cn("flex flex-col items-center gap-1", pathname === "/caisse" ? "text-forex-mint" : "text-forex-muted")}>
            <Wallet className="h-5 w-5" />
            <span className="text-[10px]">Caisse</span>
          </Link>
          <Link href={"/settings" as any} className={cn("flex flex-col items-center gap-1", pathname === "/settings" ? "text-forex-mint" : "text-forex-muted")}>
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Menu</span>
          </Link>
        </div>
      </div>
    </>
  );
}
