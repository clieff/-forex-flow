"use client";

import { SessionProvider } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        visibleToasts={4}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "toast-surface flex items-start gap-3 rounded-[24px] border border-white/10 px-4 py-4 text-forex-text",
            title: "text-sm font-semibold",
            description: "text-sm text-forex-muted",
            actionButton:
              "rounded-xl bg-accent-gradient px-3 py-2 text-xs font-semibold text-slate-950",
            cancelButton: "rounded-xl border border-white/10 px-3 py-2 text-xs text-forex-text"
          }
        }}
        icons={{
          loading: <LoaderCircle className="h-4 w-4 animate-spin text-forex-mint" />
        }}
      />
    </SessionProvider>
  );
}
