import { prisma } from "../lib/prisma.js";

// Generates a public operator id in the format HSX-YYYY-XXXX (e.g. HSX-2026-4821),
// retrying until it finds one not already in use.
export async function generateOperatorId(): Promise<string> {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt++) {
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const candidate = `HSX-${year}-${random}`;
    const existing = await prisma.operator.findUnique({
      where: { operatorId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new Error("Failed to generate a unique operator id");
}
