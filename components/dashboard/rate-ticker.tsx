"use client";

export function RateTicker({
  items
}: {
  items: Array<{ label: string; value: number; delta: number }>;
}) {
  const repeated = [...items, ...items];

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex animate-marquee gap-4">
        {repeated.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-[240px] items-center justify-between rounded-2xl border border-white/10 bg-[#111a29]/80 px-4 py-3"
          >
            <div>
              <p className="text-xs uppercase tracking-premium text-forex-muted">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.value.toFixed(item.label === "EUR/USD" ? 4 : 2)}</p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium ${
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
