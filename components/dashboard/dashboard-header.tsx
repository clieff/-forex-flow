"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, AlertTriangle, Search } from "lucide-react";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import type { StockAlert } from "@/lib/alerts";
import { GlobalSearch } from "@/components/dashboard/global-search";

const labels: Record<string, string> = {
  "": "Dashboard",
  rates: "Rates",
  transactions: "Transactions",
  new: "New Deal",
  logs: "Audit Logs",
  settings: "Settings",
  caisse: "Caisse",
  stock: "Stock",
  suppliers: "Fournisseurs",
  clients: "Clients"
};

export function DashboardHeader({
  role,
  userName,
  alerts = []
}: {
  role: Role;
  userName: string;
  alerts?: StockAlert[];
}) {
  const pathname = usePathname();
  const [showNotification, setShowNotification] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotification(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbParts = parts.length ? parts : [""];
  const pageTitle = parts.at(-1) ? labels[parts.at(-1) as string] ?? "Workspace" : "Command Center";

  return (
    <header className="relative flex flex-col gap-3 rounded-[20px] md:rounded-[30px] border border-white/10 bg-white/[0.03] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
      <div className="space-y-1 md:space-y-3 min-w-0">
        {/* Breadcrumb - caché sur mobile */}
        <motion.div
          className="hidden md:flex flex-wrap items-center gap-2 text-sm text-forex-muted"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span>ForexFlow</span>
          <ChevronRight className="h-4 w-4" />
          {breadcrumbParts.map((part, index) => (
            <motion.div
              key={`${part}-${index}`}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span className={index === breadcrumbParts.length - 1 ? "text-white" : ""}>{labels[part] ?? part}</span>
              {index !== breadcrumbParts.length - 1 && <ChevronRight className="h-4 w-4" />}
            </motion.div>
          ))}
        </motion.div>
        <div>
          <h2 className="text-lg md:text-2xl font-semibold text-white truncate">
            {pageTitle}
          </h2>
          <p className="hidden md:block mt-1 text-sm text-forex-muted">
            Pilotage en temps reel des flux FX, spreads et operations de caisse.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Desktop Search */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-forex-muted transition hover:bg-white/[0.05] hover:text-white"
        >
          <Search className="h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="hidden lg:inline-flex ml-4 items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/70">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Mobile Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex md:hidden items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-forex-muted transition active:bg-white/[0.08]"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Notifications */}
        <div className="static md:relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotification(!showNotification)}
            className="relative rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 md:p-3 text-forex-muted transition active:bg-white/[0.08] hover:text-white"
          >
            <Bell className="h-[18px] w-[18px] md:h-5 md:w-5" />
            {alerts.length > 0 && (
              <span className="absolute right-1.5 top-1.5 md:right-2 md:top-2 h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-forex-danger animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-4 right-4 md:left-auto md:right-0 mt-3 w-auto md:w-80 md:max-w-none rounded-2xl border border-white/10 bg-[#0A0F1A] shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                  <h3 className="font-semibold text-white flex items-center justify-between">
                    Notifications
                    <Badge className="border-forex-danger/20 bg-forex-danger/10 text-forex-danger">{alerts.length}</Badge>
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-forex-muted">
                      Aucune alerte pour le moment.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-forex-danger shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-white">Stock {alert.currencyCode} bas</p>
                            <p className="text-xs text-forex-muted mt-1">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar - compact on mobile */}
        <div className="flex items-center gap-2 md:gap-3 rounded-[16px] md:rounded-[24px] border border-white/10 bg-white/[0.03] px-2 py-1.5 md:px-3 md:py-2">
          <div className="gradient-border flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold text-white">
            {userName
              .split(" ")
              .slice(0, 2)
              .map((segment) => segment[0])
              .join("")}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">{userName}</p>
            <Badge className="mt-1 border-forex-mint/20 bg-forex-mint/10 text-forex-mint">
              {role === "ADMIN" ? "Admin" : "Agent"}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
