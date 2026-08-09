import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "../server/utils/cursor";

describe("bounded cursors", () => {
  it("round-trips catalog and order cursors", () => {
    const productCursor = encodeCursor("products", "prod_horizonDesk");
    expect(decodeCursor(productCursor, "products")).toMatchObject({
      kind: "products",
      key: "prod_horizonDesk",
    });

    const date = new Date("2025-07-09T13:17:00.000Z");
    const orderCursor = encodeCursor("orders", "ord_1003", date);
    expect(decodeCursor(orderCursor, "orders")).toMatchObject({
      kind: "orders",
      key: "ord_1003",
      sort: date.toISOString(),
    });
  });

  it("rejects malformed and cross-resource cursors", () => {
    expect(() => decodeCursor("not-json", "products")).toThrow();
    const cursor = encodeCursor("inventory", "var_haloBlack");
    expect(() => decodeCursor(cursor, "products")).toThrow();
  });
});
