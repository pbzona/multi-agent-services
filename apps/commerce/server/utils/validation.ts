import { assertBodySize, type ErrorDetails, type H3Event } from "nitro/h3";
import { z } from "zod";

import { apiError } from "./errors";

export const resourceIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

const productIdSchema = z
  .string()
  .min(6)
  .max(64)
  .regex(/^prod_[A-Za-z0-9]+$/);

const variantIdSchema = z
  .string()
  .min(5)
  .max(64)
  .regex(/^var_[A-Za-z0-9]+$/);

const slugSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const productParamsSchema = z.object({
  productId: productIdSchema,
});

export const variantParamsSchema = z.object({
  variantId: variantIdSchema,
});

export const productSlugParamsSchema = z.object({ slug: slugSchema });

export const orderParamsSchema = z.object({
  orderNumber: z
    .string()
    .min(12)
    .max(28)
    .regex(/^ORD-[A-Z0-9]{8,24}$/),
});

const optionalBooleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const productListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(256).optional(),
  query: z.string().trim().min(1).max(100).optional(),
  category: slugSchema.max(80).optional(),
  inStock: optionalBooleanQuery,
});

export const orderListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(256).optional(),
});

export const inventoryStateSchema = z.enum([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "backorder",
]);

export const inventoryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(256).optional(),
  query: z.string().trim().min(1).max(100).optional(),
  lowStock: optionalBooleanQuery,
});

export const cartItemSetSchema = z
  .object({
    quantity: z.number().int().min(0).max(999),
  })
  .strict();

const imageUrlSchema = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => {
    if (value.startsWith("/")) return true;
    if (!URL.canParse(value)) return false;
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  });

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5_000).optional(),
    category: slugSchema.max(80).optional(),
    imageUrls: z.array(imageUrlSchema).max(12).optional(),
    status: z.enum(["active", "draft", "archived"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const inventorySetSchema = z
  .object({
    quantity: z.number().int().min(0).max(1_000_000),
    expectedVersion: z.number().int().min(1).max(2_147_483_647),
  })
  .strict();

export async function assertBoundedJsonBody(
  event: H3Event,
  limit: number,
): Promise<void> {
  const contentType =
    event.req.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() ?? "";
  if (contentType !== "application/json") {
    throw apiError(400, "BAD_REQUEST", "A JSON request body is required.");
  }
  try {
    await assertBodySize(event, limit);
  } catch {
    throw apiError(400, "BAD_REQUEST", "The request body is too large.");
  }
}

export function sanitizedValidationError(source: string): ErrorDetails {
  return {
    status: 400,
    statusText: "Bad Request",
    message: `Invalid ${source}.`,
  };
}
