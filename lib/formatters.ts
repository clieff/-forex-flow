export function formatMoney(value: number, currency: string = "XAF") {
  if (currency === "XAF") {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(value) + " XAF"
    );
  }

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(value);
  } catch (e) {
    // Fallback if currency code is not supported by Intl
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(value) + " " + currency
    );
  }
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
