import { RateCard } from "@/components/rates/rate-card";
import type { CurrencyDto } from "@/types/dto";

export function RatesGrid({
  currencies,
  editable
}: {
  currencies: CurrencyDto[];
  editable: boolean;
}) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
      {currencies.map((currency) => (
        <RateCard key={currency.code} currency={currency} editable={editable} />
      ))}
    </div>
  );
}
