"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  List,
  Plus,
  Settings,
  Truck,
  Users,
  Wallet,
  Menu,
  X
} from "lucide-react";

import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  List,
  Globe
};

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const availableItems = NAV_ITEMS.filter((item) => !item.role || item.role === role);

  return (
    <>
      <div className="xl:hidden">
        <div className="flex gap-3 overflow-x-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-3 scrollbar-hide">
          {availableItems.map((item) => {
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="border-t border-white/[0.08] bg-[#060B14]/85 backdrop-blur-2xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
            <NavItem href="/" icon={LayoutDashboard} label="Accueil" active={pathname === "/"} />
            <NavItem href="/transactions" icon={List} label="Historique" active={pathname === "/transactions"} />
            
            <div className="relative flex flex-col items-center -mt-5">
              <Link
                href={"/transactions/new" as any}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-forex-mint to-forex-lagoon text-[#0A0F1A] shadow-[0_4px_20px_rgba(0,201,167,0.35)] active:scale-90 transition-all"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </Link>
              <span className="mt-1 text-[10px] font-medium text-forex-mint">Nouveau</span>
            </div>

            <NavItem href="/caisse" icon={Wallet} label="Caisse" active={pathname === "/caisse"} />
            
            <button
              onClick={() => setIsMenuOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors min-w-[56px]",
                "text-forex-muted active:text-white"
              )}
            >
              <Menu className="h-[22px] w-[22px]" />
              <span className="text-[10px] font-medium leading-tight">Menu</span>
            </button>
          </div>
        </div>
      </nav>

      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="w-[95vw] rounded-3xl border-white/10 bg-[#060B14] p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Navigation</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {availableItems.map((item) => {
              const Icon = icons[item.icon as keyof typeof icons];
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05]"
                >
                  <Icon className="h-5 w-5 text-forex-mint" />
                  <span className="font-medium text-white">{item.label}</span>
                </Link>
              );
            })}
          </div>


        </DialogContent>
      </Dialog>
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
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href as any}
      className={cn(
        "flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
        active ? "text-white" : "text-forex-muted"
      )}
    >
      <Icon className="h-[22px] w-[22px]" />
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </Link>
  );
}
