import { describe, expect, it } from "vitest";

import {
  seedCartItems,
  seedInventory,
  seedOrderItems,
  seedOrders,
  seedProducts,
  seedVariants,
} from "../server/db/seed-data";

describe("commerce seed data", () => {
  it("contains a deterministic, contract-safe catalog", () => {
    expect(seedProducts).toHaveLength(12);
    expect(seedVariants.length).toBeGreaterThan(12);
    expect(new Set(seedProducts.map((product) => product.id)).size).toBe(12);
    expect(new Set(seedVariants.map((variant) => variant.sku)).size).toBe(
      seedVariants.length,
    );

    for (const product of seedProducts) {
      expect(product.id).toMatch(/^prod_[A-Za-z0-9]+$/);
      expect(product.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(
        product.imageUrls?.every(
          (url) => url.startsWith("/") || URL.canParse(url),
        ),
      ).toBe(true);
      expect(
        seedVariants.some((variant) => variant.productId === product.id),
      ).toBe(true);
    }
    for (const variant of seedVariants) {
      expect(variant.id).toMatch(/^var_[A-Za-z0-9]+$/);
    }
  });

  it("covers believable inventory states for every variant", () => {
    expect(seedInventory).toHaveLength(seedVariants.length);
    expect(new Set(seedInventory.map((row) => row.state))).toEqual(
      new Set(["in_stock", "low_stock", "out_of_stock", "backorder"]),
    );

    for (const row of seedInventory) {
      expect(row.quantity).toBeGreaterThanOrEqual(row.reserved ?? 0);
      expect(row.lowStockThreshold).toBeGreaterThanOrEqual(0);
      expect(seedVariants.some((variant) => variant.id === row.variantId)).toBe(
        true,
      );
    }
  });

  it("has one current cart and four internally consistent orders", () => {
    expect(seedCartItems).toHaveLength(3);
    expect(seedOrders).toHaveLength(4);

    for (const order of seedOrders) {
      expect(order.number).toMatch(/^ORD-[A-Z0-9]{8,24}$/);
      const itemSubtotal = seedOrderItems
        .filter((item) => item.orderId === order.id)
        .reduce((sum, item) => sum + item.lineTotalCents, 0);
      expect(itemSubtotal).toBe(order.subtotalCents);
      expect(order.totalCents).toBe(
        order.subtotalCents + order.shippingCents + order.taxCents,
      );
    }
  });
});
