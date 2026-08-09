import { describe, expect, it } from "vitest";

import { commerceOpenApi, withCommerceServer } from "../src/index.js";

const HTTP_METHODS = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]);

const EXPECTED_OPERATIONS = {
  "/api/health": ["get"],
  "/api/openapi.json": ["get"],
  "/api/v1/admin/inventory": ["get"],
  "/api/v1/admin/inventory/{variantId}": ["put"],
  "/api/v1/admin/products/{productId}": ["patch"],
  "/api/v1/cart": ["get"],
  "/api/v1/cart/items/{variantId}": ["put"],
  "/api/v1/orders": ["get"],
  "/api/v1/orders/{orderNumber}": ["get"],
  "/api/v1/products": ["get"],
  "/api/v1/products/{slug}": ["get"],
} as const;

const EXPECTED_OPERATION_IDS = [
  "getCurrentCart",
  "getCurrentCustomerOrder",
  "getProduct",
  "listCurrentCustomerOrders",
  "listInventory",
  "listProducts",
  "setCartItemQuantity",
  "setInventoryLevel",
  "updateProduct",
].sort();

function operationIds(): string[] {
  const ids = [];
  for (const pathItem of Object.values(commerceOpenApi.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || typeof operation !== "object") continue;
      if ("operationId" in operation) ids.push(String(operation.operationId));
    }
  }
  return ids;
}

describe("commerce OpenAPI contract", () => {
  it("has unique, expected operationIds", () => {
    const ids = operationIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(EXPECTED_OPERATION_IDS);
  });

  it("contains exactly the expected methods and paths", () => {
    expect(Object.keys(commerceOpenApi.paths).sort()).toEqual(
      Object.keys(EXPECTED_OPERATIONS).sort(),
    );

    for (const [path, expectedMethods] of Object.entries(EXPECTED_OPERATIONS)) {
      const pathItem =
        commerceOpenApi.paths[path as keyof typeof commerceOpenApi.paths];
      const methods = Object.keys(pathItem).filter((method) =>
        HTTP_METHODS.has(method),
      );
      expect(methods.sort(), path).toEqual([...expectedMethods].sort());
    }
  });

  it("overrides servers without mutating the canonical document", () => {
    const url = "https://commerce.internal.example";
    const configured = withCommerceServer(url);

    expect(configured).not.toBe(commerceOpenApi);
    expect(configured.servers).toEqual([{ url }]);
    expect(configured.paths).toBe(commerceOpenApi.paths);
    expect(commerceOpenApi.servers).toEqual([{ url: "/" }]);
  });
});
