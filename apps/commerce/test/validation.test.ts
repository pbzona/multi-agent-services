import { describe, expect, it } from "vitest";

import {
  cartItemSetSchema,
  inventorySetSchema,
  productListQuerySchema,
  productUpdateSchema,
  variantParamsSchema,
} from "../server/utils/validation";

describe("contract request validation", () => {
  it("parses bounded product query values without truthy string coercion", () => {
    expect(
      productListQuerySchema.parse({ limit: "100", inStock: "false" }),
    ).toMatchObject({ limit: 100, inStock: false });
    expect(() => productListQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("accepts absolute quantities and rejects additive-looking payloads", () => {
    expect(cartItemSetSchema.parse({ quantity: 0 })).toEqual({ quantity: 0 });
    expect(cartItemSetSchema.parse({ quantity: 999 })).toEqual({
      quantity: 999,
    });
    expect(() => cartItemSetSchema.parse({ quantity: 1, delta: 1 })).toThrow();
    expect(() => cartItemSetSchema.parse({ quantity: 1000 })).toThrow();
  });

  it("requires inventory optimistic concurrency and exact fields", () => {
    expect(
      inventorySetSchema.parse({ quantity: 12, expectedVersion: 1 }),
    ).toEqual({ quantity: 12, expectedVersion: 1 });
    expect(() =>
      inventorySetSchema.parse({ quantity: 12, expectedVersion: 0 }),
    ).toThrow();
    expect(() => inventorySetSchema.parse({ quantity: 12 })).toThrow();
    expect(() =>
      inventorySetSchema.parse({
        quantity: 12,
        expectedVersion: 1,
        adjustment: 2,
      }),
    ).toThrow();
  });

  it("matches contract identifiers and product image updates", () => {
    expect(variantParamsSchema.parse({ variantId: "var_haloBlack" })).toEqual({
      variantId: "var_haloBlack",
    });
    expect(() =>
      variantParamsSchema.parse({ variantId: "var_halo_black" }),
    ).toThrow();
    expect(
      productUpdateSchema.parse({
        imageUrls: ["https://cdn.example.com/product.jpg"],
      }),
    ).toEqual({ imageUrls: ["https://cdn.example.com/product.jpg"] });
  });
});
