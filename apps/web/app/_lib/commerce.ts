import "server-only";

import type { components } from "@repo/commerce-contract";
import {
  createCommerceAccessToken,
  DEMO_PERSONAS,
  type CommercePrincipal,
  type DemoRole,
} from "@repo/demo-auth";
import { cache } from "react";
import { getDemoPrincipal } from "./session";

export type Product = components["schemas"]["Product"];
export type ProductVariant = components["schemas"]["ProductVariant"];
export type ProductPage = components["schemas"]["ProductPage"];
export type Cart = components["schemas"]["Cart"];
export type CartItem = components["schemas"]["CartItem"];
export type Order = components["schemas"]["Order"];
export type OrderPage = components["schemas"]["OrderPage"];
export type InventoryItem = components["schemas"]["InventoryItem"];
export type InventoryPage = components["schemas"]["InventoryPage"];

type ApiErrorBody = components["schemas"]["ErrorResponse"];
type CommerceActor = "web" | DemoRole;

export class CommerceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    message: string,
    status = 500,
    code = "COMMERCE_UNAVAILABLE",
    requestId?: string,
  ) {
    super(message);
    this.name = "CommerceError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

function commerceBaseUrl(): string {
  // Vercel injects this URL from the commerce service binding at runtime.
  const bindingUrl = process.env.COMMERCE_URL;
  if (!bindingUrl) {
    throw new CommerceError(
      "COMMERCE_URL is not configured. Start the commerce service binding.",
    );
  }

  return bindingUrl;
}

async function principalFor(actor: CommerceActor): Promise<CommercePrincipal> {
  if (actor === "web") {
    return {
      id: "web_storefront",
      role: "web",
      workspaceId: DEMO_PERSONAS.customer.workspaceId,
    };
  }

  const principal = await getDemoPrincipal();
  if (principal.role !== actor) {
    throw new CommerceError(
      `The ${actor} persona is required for this request.`,
      403,
      "FORBIDDEN",
    );
  }
  return principal;
}

async function commerceFetch<T>(
  path: string,
  actor: CommerceActor,
  init?: RequestInit,
): Promise<T> {
  const token = await createCommerceAccessToken(await principalFor(actor));
  const baseUrl = commerceBaseUrl().replace(/\/$/, "");
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body) headers.set("content-type", "application/json");
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers,
      signal: init?.signal ?? AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new CommerceError(
      cause instanceof DOMException && cause.name === "TimeoutError"
        ? "Commerce service request timed out."
        : "Commerce service request failed.",
    );
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorBody | null;
    throw new CommerceError(
      body?.error?.message ?? `Commerce service returned ${response.status}.`,
      response.status,
      body?.error?.code ?? "COMMERCE_ERROR",
      body?.error?.requestId,
    );
  }

  return (await response.json()) as T;
}

export const listProducts = cache(async (): Promise<Product[]> => {
  const page = await commerceFetch<ProductPage>(
    "/api/v1/products?limit=100",
    "web",
  );
  return page.items;
});

export const getProduct = cache(async (slug: string): Promise<Product> => {
  return commerceFetch<Product>(
    `/api/v1/products/${encodeURIComponent(slug)}`,
    "web",
  );
});

export const getCart = cache(async (): Promise<Cart> => {
  return commerceFetch<Cart>("/api/v1/cart", "customer");
});

export async function setCartItemQuantity(
  variantId: string,
  quantity: number,
): Promise<Cart> {
  return commerceFetch<Cart>(
    `/api/v1/cart/items/${encodeURIComponent(variantId)}`,
    "customer",
    { method: "PUT", body: JSON.stringify({ quantity }) },
  );
}

export const listOrders = cache(async (): Promise<Order[]> => {
  const page = await commerceFetch<OrderPage>(
    "/api/v1/orders?limit=100",
    "customer",
  );
  return page.items;
});

export const getOrder = cache(async (number: string): Promise<Order> => {
  return commerceFetch<Order>(
    `/api/v1/orders/${encodeURIComponent(number)}`,
    "customer",
  );
});

export const listInventory = cache(async (): Promise<InventoryItem[]> => {
  const page = await commerceFetch<InventoryPage>(
    "/api/v1/admin/inventory?limit=100",
    "admin",
  );
  return page.items;
});
