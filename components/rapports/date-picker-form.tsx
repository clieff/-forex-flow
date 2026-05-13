"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

export function DatePickerForm({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-forex-muted" />
      <input
        type="date"
        defaultValue={defaultValue}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/rapports?date=${e.target.value}`);
          }
        }}
      />
    </div>
  );
}
