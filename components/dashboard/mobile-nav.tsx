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
        <div className="flex gap-3 overflow-x-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-3 scrollbar-hide">
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

      {/* Bottom Bar native pour Mobile (jusqu'à md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Glassmorphism background */}
        <div className="border-t border-white/[0.08] bg-[#060B14]/85 backdrop-blur-2xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
            <NavItem
              href="/"
              icon={LayoutDashboard}
              label="Accueil"
              active={pathname === "/"}
            />
            <NavItem
              href="/transactions"
              icon={List}
              label="Historique"
              active={pathname === "/transactions"}
            />
            
            {/* Floating Action Button central */}
            <div className="relative flex flex-col items-center -mt-5">
              <Link
                href={"/transactions/new" as any}
                className={cn(
                  "flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-all active:scale-90",
                  "bg-gradient-to-br from-forex-mint to-forex-lagoon text-[#0A0F1A]",
                  "shadow-[0_4px_20px_rgba(0,201,167,0.35)]"
                )}
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </Link>
              <span className="mt-1 text-[10px] font-medium text-forex-mint">Nouveau</span>
            </div>

            <NavItem
              href="/caisse"
              icon={Wallet}
              label="Caisse"
              active={pathname === "/caisse"}
            />
            <NavItem
              href="/settings"
              icon={Settings}
              label="Plus"
              active={pathname === "/settings" || pathname === "/rates" || pathname === "/stock" || pathname === "/suppliers" || pathname === "/logs" || pathname === "/clients"}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href as any}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors min-w-[56px]",
        active ? "text-forex-mint" : "text-forex-muted active:text-white"
      )}
    >
      <div className="relative">
        <Icon className={cn("h-[22px] w-[22px]", active && "drop-shadow-[0_0_6px_rgba(0,201,167,0.5)]")} />
        {active && (
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-forex-mint" />
        )}
      </div>
      <span className={cn("text-[10px] leading-tight", active ? "font-semibold" : "font-medium")}>{label}</span>
    </Link>
  );
}
