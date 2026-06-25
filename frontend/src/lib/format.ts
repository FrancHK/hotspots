// Formats an integer amount of Tanzanian shillings, e.g. 16000 -> "16,000 TZS".
export function formatTZS(amount: number): string {
  return `${amount.toLocaleString("en-US")} TZS`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Human duration, e.g. (2, "hours") -> "Saa 2".
export function formatDuration(value: number, unit: string): string {
  const map: Record<string, string> = {
    minutes: "Dakika",
    hours: "Saa",
    days: "Siku",
  };
  return `${map[unit] ?? unit} ${value}`;
}
