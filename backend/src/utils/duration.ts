import type { DurationUnit } from "@prisma/client";

// Converts a duration + unit into minutes (the common currency the network
// adapters and sessions work in).
export function toMinutes(value: number, unit: DurationUnit): number {
  switch (unit) {
    case "minutes":
      return value;
    case "hours":
      return value * 60;
    case "days":
      return value * 60 * 24;
    default:
      return value;
  }
}

// Computes a session end time given a start and a duration in minutes.
export function endTimeFrom(start: Date, minutes: number): Date {
  return new Date(start.getTime() + minutes * 60_000);
}
