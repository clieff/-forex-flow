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
  rate
}: {
  currency?: CurrencyDto;
  amountGiven: number;
  amountReceived: number;
  type: Type;
  clientName?: string;
  rate: number;
}) {
  return (
    <div className="receipt-paper mx-auto w-full max-w-md rounded-[28px] sm:rounded-[34px] border border-slate-200/70 p-5 sm:p-8 text-slate-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">ForexFlow Pro</p>
          <h3 className="mt-2 text-2xl font-semibold">Transaction Slip</h3>
        </div>
        <div className="rounded-2xl border border-slate-200 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{type}</p>
          <p className="mt-1 text-sm font-medium">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>

      <div className="space-y-4 border-y border-dashed border-slate-300 py-6">
        <ReceiptRow label="Client" value={clientName || "Walk-in client"} />
        <ReceiptRow label="Devise" value={currency?.code ?? "--"} />
        <ReceiptRow
          label="Montant donne"
          value={type === "BUY" ? formatMoney(amountGiven, currency?.code) : formatMoney(amountGiven)}
        />
        <ReceiptRow
          label="Montant recu"
          value={type === "BUY" ? formatMoney(amountReceived) : formatMoney(amountReceived, currency?.code)}
        />
        <ReceiptRow label="Taux applique" value={rate ? `${rate.toFixed(2)} XAF` : "--"} />
      </div>

      <div className="mt-6 rounded-[24px] bg-slate-900 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Merci pour votre confiance</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Recu de demonstration genere en direct, pret pour l'export PDF et l'archivage interne.
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
