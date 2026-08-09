import type { components } from "@repo/commerce-contract";
import { and, asc, eq, gt, ilike, or, sql } from "drizzle-orm";
import type { z } from "zod";

import { getDb } from "../db/client";
import { inventory, products, productVariants } from "../db/schema";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { apiError } from "../utils/errors";
import type {
  inventoryListQuerySchema,
  inventorySetSchema,
} from "../utils/validation";

type InventoryItemDto = components["schemas"]["InventoryItem"];
type InventoryPageDto = components["schemas"]["InventoryPage"];
type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
type InventorySetInput = z.infer<typeof inventorySetSchema>;

const selection = {
  variantId: inventory.variantId,
  productId: products.id,
  sku: productVariants.sku,
  productName: products.name,
  variantName: productVariants.name,
  quantity: inventory.quantity,
  reserved: inventory.reserved,
  lowStockThreshold: inventory.lowStockThreshold,
  version: inventory.version,
  state: inventory.state,
  updatedAt: inventory.updatedAt,
};

type InventoryRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  version: number;
  state: string;
  updatedAt: Date;
};

function mapInventory(row: InventoryRow): InventoryItemDto {
  return {
    variantId: row.variantId,
    productId: row.productId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    quantity: row.quantity,
    reservedQuantity: row.reserved,
    availableQuantity: Math.max(0, row.quantity - row.reserved),
    lowStockThreshold: row.lowStockThreshold,
    state: row.state as InventoryItemDto["state"],
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getInventoryRow(
  workspaceId: string,
  variantId: string,
): Promise<InventoryRow | undefined> {
  const [row] = await getDb()
    .select(selection)
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(inventory.workspaceId, workspaceId),
        eq(inventory.variantId, variantId),
        eq(products.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return row;
}

export async function listInventory(
  workspaceId: string,
  query: InventoryListQuery,
): Promise<InventoryPageDto> {
  const cursor = decodeCursor(query.cursor, "inventory");
  const filters = [
    eq(inventory.workspaceId, workspaceId),
    eq(products.workspaceId, workspaceId),
  ];
  if (cursor) filters.push(gt(inventory.variantId, cursor.key));
  if (query.query) {
    const pattern = `%${query.query}%`;
    filters.push(
      or(
        ilike(products.name, pattern),
        ilike(productVariants.name, pattern),
        ilike(productVariants.sku, pattern),
      )!,
    );
  }
  if (query.lowStock) {
    filters.push(
      sql`${inventory.quantity} - ${inventory.reserved} <= ${inventory.lowStockThreshold}`,
    );
  }

  const rows = await getDb()
    .select(selection)
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(...filters))
    .orderBy(asc(inventory.variantId))
    .limit(query.limit + 1);
  const pageRows = rows.slice(0, query.limit);
  const last = pageRows.at(-1);

  return {
    items: pageRows.map(mapInventory),
    nextCursor:
      rows.length > query.limit && last
        ? encodeCursor("inventory", last.variantId)
        : null,
  };
}

export async function setInventoryLevel(
  workspaceId: string,
  variantId: string,
  input: InventorySetInput,
): Promise<InventoryItemDto> {
  const current = await getInventoryRow(workspaceId, variantId);
  if (!current) throw apiError(404, "NOT_FOUND", "Inventory record not found.");
  if (input.quantity < current.reserved) {
    throw apiError(
      409,
      "CONFLICT",
      "Quantity cannot be lower than the reserved quantity.",
    );
  }
  if (input.expectedVersion !== current.version) {
    throw apiError(
      409,
      "VERSION_MISMATCH",
      "Inventory changed after it was read. Refresh and retry.",
    );
  }
  if (input.quantity === current.quantity) return mapInventory(current);
  if (current.version >= 2_147_483_647) {
    throw apiError(409, "CONFLICT", "Inventory version cannot be advanced.");
  }

  const available = input.quantity - current.reserved;
  const state =
    input.quantity === 0
      ? "out_of_stock"
      : available <= current.lowStockThreshold
        ? "low_stock"
        : "in_stock";
  const [updated] = await getDb()
    .update(inventory)
    .set({
      quantity: input.quantity,
      state,
      version: current.version + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.workspaceId, workspaceId),
        eq(inventory.variantId, variantId),
        eq(inventory.version, input.expectedVersion),
      ),
    )
    .returning({ variantId: inventory.variantId });

  const latest = await getInventoryRow(workspaceId, variantId);
  if (!latest) throw apiError(404, "NOT_FOUND", "Inventory record not found.");
  if (!updated && latest.quantity !== input.quantity) {
    throw apiError(
      409,
      "VERSION_MISMATCH",
      "Inventory changed after it was read. Refresh and retry.",
    );
  }
  return mapInventory(latest);
}
