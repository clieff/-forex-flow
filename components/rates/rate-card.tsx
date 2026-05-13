"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CurrencyDto } from "@/types/dto";

export function RateCard({
  currency,
  editable
}: {
  currency: CurrencyDto;
  editable: boolean;
}) {
  const [buyRate, setBuyRate] = useState(currency.buyRate);
  const [sellRate, setSellRate] = useState(currency.sellRate);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const initialized = useRef(false);

  const spread = useMemo(() => Number((sellRate - buyRate).toFixed(2)), [buyRate, sellRate]);
  const midpoint = useMemo(() => (buyRate + sellRate) / 2, [buyRate, sellRate]);

  useEffect(() => {
    if (!editable) {
      return;
    }

    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const timeout = window.setTimeout(async () => {
      setStatus("saving");
      const response = await fetch("/api/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currencyCode: currency.code,
          buyRate,
          sellRate
        })
      });

      if (response.ok) {
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 1800);
      } else {
        setStatus("idle");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [buyRate, sellRate, editable, currency.code]);

  return (
    <div className="panel panel-hover relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forex-mint/60 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-premium text-forex-muted">Devise</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{currency.code}</h3>
          <p className="mt-1 text-sm text-forex-muted">{currency.name}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-premium text-forex-muted">Marge</p>
          <p className="mt-1 text-lg font-semibold text-forex-mint">{spread.toFixed(2)} XAF</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-premium text-forex-muted">Buy Rate</p>
          <Input
            type="number"
            step="0.01"
            value={buyRate}
            onChange={(event) => setBuyRate(Number(event.target.value))}
            disabled={!editable}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-premium text-forex-muted">Sell Rate</p>
          <Input
            type="number"
            step="0.01"
            value={sellRate}
            onChange={(event) => setSellRate(Number(event.target.value))}
            disabled={!editable}
          />
        </div>
      </div>

      {editable ? (
        <div className="mt-6 space-y-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-sm text-forex-muted">
            <span>Ajustement du spread</span>
            <span>{spread.toFixed(2)} XAF</span>
          </div>
          <Slider
            min={1}
            max={30}
            step={0.5}
            value={[spread]}
            onValueChange={([value]) => {
              const nextSpread = Number(value.toFixed(2));
              setBuyRate(Number((midpoint - nextSpread / 2).toFixed(2)));
              setSellRate(Number((midpoint + nextSpread / 2).toFixed(2)));
            }}
          />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-forex-muted">
              <TrendingUp className="h-4 w-4 text-forex-mint" />
              Benefice theorique
            </div>
            <span className="font-semibold text-white">Marge : {spread.toFixed(1)} XAF</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {status === "saving" && (
                <span className="inline-flex items-center gap-2 text-forex-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              )}
              {status === "saved" && (
                <span className="inline-flex items-center gap-2 text-forex-mint">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setStatus("idle")}>
              Auto-save on
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-forex-muted">
          Consultation seule. Les ajustements de spread sont reserves au role Admin.
        </div>
      )}
    </div>
  );
}
