import type { PaymentMethod } from "@prisma/client";

// Normalises a Tanzanian phone number to the 255XXXXXXXXX form Snippe expects.
// Accepts 0712…, 712…, +255712…, 255712… etc.
export function normalizeTzPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("255")) {
    // already correct
  } else if (digits.startsWith("0")) {
    digits = "255" + digits.slice(1);
  } else if (digits.length === 9) {
    digits = "255" + digits; // bare 7XXXXXXXX
  }
  return digits;
}

// Maps a normalised number to a mobile-money method by carrier prefix.
// Commission is identical (10%) across mobile money, so this is for reporting.
// Halotel / unknown fall back to mpesa (enum has no halotel value).
export function detectMobileMethod(normalized: string): PaymentMethod {
  // National 3-digit prefix, e.g. 255 74XXXXXXX -> "074".
  const prefix = "0" + normalized.slice(3, 5);

  if (["074", "075", "076"].includes(prefix)) return "mpesa"; // Vodacom
  if (["078", "068", "069"].includes(prefix)) return "airtel"; // Airtel
  if (["071", "065", "067", "077"].includes(prefix)) return "tigopesa"; // Tigo/Mixx/Zantel

  return "mpesa";
}
