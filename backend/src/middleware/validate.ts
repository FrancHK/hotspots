import type { ZodType } from "zod";

// Parses & sanitises a request payload against a Zod schema.
// Throws a ZodError (handled centrally) on failure.
export function validateBody<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
