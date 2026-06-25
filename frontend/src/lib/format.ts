// Formats an integer amount of Tanzanian shillings, e.g. 16000 -> "16,000 TZS".
export function formatTZS(amount: number): string {
  return `${amount.toLocaleString("en-US")} TZS`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Short date in day-month-year form, e.g. "25 Jun 2026".
export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Date + time, e.g. "25 Jun, 14:32".
export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
