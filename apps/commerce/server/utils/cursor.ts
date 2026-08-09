import { z } from "zod";

import { apiError } from "./errors";

const cursorSchema = z.object({
  v: z.literal(1),
  kind: z.enum(["products", "orders", "inventory"]),
  key: z.string().min(1).max(128),
  sort: z.string().datetime().optional(),
});

type CursorKind = z.infer<typeof cursorSchema>["kind"];
export type DecodedCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(
  kind: CursorKind,
  key: string,
  sort?: Date,
): string {
  const payload = cursorSchema.parse({
    v: 1,
    kind,
    key,
    ...(sort ? { sort: sort.toISOString() } : {}),
  });
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(
  value: string | undefined,
  kind: CursorKind,
): DecodedCursor | undefined {
  if (!value) return undefined;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (decoded.length > 512) throw new Error("Cursor is too large.");
    const payload = cursorSchema.parse(JSON.parse(decoded));
    if (payload.kind !== kind) throw new Error("Cursor kind does not match.");
    if (kind === "orders" && !payload.sort) {
      throw new Error("Order cursor is missing its sort value.");
    }
    return payload;
  } catch {
    throw apiError(400, "BAD_REQUEST", "The pagination cursor is invalid.");
  }
}
