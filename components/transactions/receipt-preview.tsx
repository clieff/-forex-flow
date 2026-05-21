"use client";

import type { Type } from "@prisma/client";
import { format } from "date-fns";
import { formatMoney } from "@/lib/formatters";
import type { CurrencyDto } from "@/types/dto";

export function ReceiptPreview({
  currency,
  amountGiven,
  amountReceived,
  type,
  clientName,
  rate,
}: {
  currency?: CurrencyDto;
  amountGiven: number;
  amountReceived: number;
  type: Type;
  clientName?: string;
  rate: number;
}) {
  return (
    <div className="receipt-paper mx-auto w-full max-w-xs lg:max-w-sm rounded-[20px] lg:rounded-[28px] border border-slate-200/70 p-4 lg:p-6 text-slate-900 sticky top-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            ForexFlow
          </p>
          <h3 className="mt-1 text-lg lg:text-2xl font-semibold">Slip</h3>
        </div>
        <div className="rounded-xl lg:rounded-2xl border border-slate-200 px-3 lg:px-4 py-1 lg:py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {type}
          </p>
          <p className="mt-0.5 text-xs lg:text-sm font-medium">
            {format(new Date(), "dd/MM HH:mm")}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-y border-dashed border-slate-300 py-4 lg:py-5">
        <ReceiptRow label="Client" value={clientName || "Walk-in"} />
        <ReceiptRow label="Devise" value={currency?.code ?? "--"} />
        <ReceiptRow
          label="Montant donne"
          value={
            type === "BUY"
              ? formatMoney(amountGiven, currency?.code)
              : formatMoney(amountGiven)
          }
        />
        <ReceiptRow
          label="Montant recu"
          value={
            type === "BUY"
              ? formatMoney(amountReceived)
              : formatMoney(amountReceived, currency?.code)
          }
        />
        <ReceiptRow
          label="Taux"
          value={rate ? `${rate.toFixed(2)} XAF` : "--"}
        />
      </div>

      <div className="mt-4 lg:mt-5 rounded-[16px] lg:rounded-[24px] bg-slate-900 p-3 lg:p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
          Merci!
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          Recu genere et pret pour l'export.
        </p>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}
