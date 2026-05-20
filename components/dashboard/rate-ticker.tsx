"use client";

export function RateTicker({
  items
}: {
  items: Array<{ label: string; value: number; delta: number }>;
}) {
  const repeated = [...items, ...items];

  return (
    <div className="overflow-hidden rounded-[20px] md:rounded-[26px] border border-white/10 bg-white/[0.04] p-2.5 md:p-4">
      <div className="flex animate-marquee gap-3 md:gap-4">
        {repeated.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-[180px] md:min-w-[240px] items-center justify-between rounded-xl md:rounded-2xl border border-white/10 bg-[#111a29]/80 px-3 py-2.5 md:px-4 md:py-3"
          >
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-premium text-forex-muted">{item.label}</p>
              <p className="mt-0.5 md:mt-1 text-base md:text-lg font-semibold text-white">{item.value.toFixed(item.label === "EUR/USD" ? 4 : 2)}</p>
            </div>
            <div
              className={`rounded-full px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-medium ${
                item.delta >= 0 ? "bg-forex-mint/10 text-forex-mint" : "bg-forex-danger/10 text-forex-danger"
              }`}
            >
              {item.delta >= 0 ? "+" : ""}
              {item.delta.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
