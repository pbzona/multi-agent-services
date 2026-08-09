import type { components } from "@repo/commerce-contract";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import type { z } from "zod";

import { getDb } from "../db/client";
import { orderItems, orders, type Order as OrderRecord } from "../db/schema";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { apiError } from "../utils/errors";
import type { orderListQuerySchema } from "../utils/validation";

type OrderDto = components["schemas"]["Order"];
type OrderPageDto = components["schemas"]["OrderPage"];
type OrderListQuery = z.infer<typeof orderListQuerySchema>;
type OrderItemRecord = typeof orderItems.$inferSelect;

function orderStatus(value: string): OrderDto["status"] {
  if (
    value === "pending" ||
    value === "confirmed" ||
    value === "processing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value;
  }
  throw new Error("Order has an invalid status.");
}

function mapOrder(order: OrderRecord, items: OrderItemRecord[]): OrderDto {
  const money = (amount: number) => ({ amount, currency: order.currency });
  return {
    orderNumber: order.number,
    status: orderStatus(order.status),
    items: items.slice(0, 100).map((item) => ({
      variantId: item.variantId,
      sku: item.sku,
      productSlug: item.productSlug,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: money(item.unitPriceCents),
      lineTotal: money(item.lineTotalCents),
    })),
    subtotal: money(order.subtotalCents),
    shipping: money(order.shippingCents),
    tax: money(order.taxCents),
    total: money(order.totalCents),
    placedAt: order.placedAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function mapOrders(rows: OrderRecord[]): Promise<OrderDto[]> {
  if (rows.length === 0) return [];
  const itemRows = await getDb()
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((order) => order.id),
      ),
    )
    .orderBy(orderItems.id);
  const byOrder = new Map<string, OrderItemRecord[]>();
  for (const item of itemRows) {
    const current = byOrder.get(item.orderId) ?? [];
    current.push(item);
    byOrder.set(item.orderId, current);
  }
  return rows.map((order) => mapOrder(order, byOrder.get(order.id) ?? []));
}

export async function listCurrentCustomerOrders(
  workspaceId: string,
  customerId: string,
  query: OrderListQuery,
): Promise<OrderPageDto> {
  const cursor = decodeCursor(query.cursor, "orders");
  const filters = [
    eq(orders.workspaceId, workspaceId),
    eq(orders.customerId, customerId),
  ];
  if (cursor?.sort) {
    const placedAt = new Date(cursor.sort);
    filters.push(
      or(
        lt(orders.placedAt, placedAt),
        and(eq(orders.placedAt, placedAt), lt(orders.id, cursor.key)),
      )!,
    );
  }

  const rows = await getDb()
    .select()
    .from(orders)
    .where(and(...filters))
    .orderBy(desc(orders.placedAt), desc(orders.id))
    .limit(query.limit + 1);
  const pageRows = rows.slice(0, query.limit);
  const last = pageRows.at(-1);

  return {
    items: await mapOrders(pageRows),
    nextCursor:
      rows.length > query.limit && last
        ? encodeCursor("orders", last.id, last.placedAt)
        : null,
  };
}

export async function getCurrentCustomerOrder(
  workspaceId: string,
  customerId: string,
  orderNumber: string,
): Promise<OrderDto> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.workspaceId, workspaceId),
        eq(orders.customerId, customerId),
        eq(orders.number, orderNumber),
      ),
    )
    .limit(1);
  if (!order) throw apiError(404, "NOT_FOUND", "Order not found.");

  const [result] = await mapOrders([order]);
  if (!result) throw new Error("Order mapping failed.");
  return result;
}
