import { prisma } from "../lib/prisma.js";

// Unambiguous charset — excludes 0/O and 1/I to avoid confusion when typed.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SEGMENTS = 3;
const SEGMENT_LEN = 4;

function randomSegment(): string {
  let s = "";
  for (let i = 0; i < SEGMENT_LEN; i++) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return s;
}

// Produces a code in the format XXXX-XXXX-XXXX.
export function randomVoucherCode(): string {
  return Array.from({ length: SEGMENTS }, randomSegment).join("-");
}

// Generates `count` globally-unique voucher codes (checked against the DB and
// against each other) ready for a batch insert.
export async function generateUniqueVoucherCodes(
  count: number,
): Promise<string[]> {
  const codes = new Set<string>();
  let safety = 0;

  while (codes.size < count) {
    if (safety++ > 50) {
      throw new Error("Unable to generate enough unique voucher codes");
    }

    const remaining = count - codes.size;
    const candidates = new Set<string>();
    while (candidates.size < remaining + 20) {
      candidates.add(randomVoucherCode());
    }

    const fresh = [...candidates].filter((c) => !codes.has(c));
    const existing = await prisma.voucher.findMany({
      where: { code: { in: fresh } },
      select: { code: true },
    });
    const taken = new Set(existing.map((e) => e.code));

    for (const c of fresh) {
      if (!taken.has(c) && codes.size < count) codes.add(c);
    }
  }

  return [...codes];
}
