import { createHash } from "node:crypto";

import type { components } from "@repo/commerce-contract";
import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "../db/client";
import {
  cartItems,
  carts,
  inventory,
  products,
  productVariants,
  users,
  type Cart as CartRecord,
} from "../db/schema";
import { apiError } from "../utils/errors";

type CartDto = components["schemas"]["Cart"];

async function ensureCurrentCart(
  workspaceId: string,
  customerId: string,
): Promise<CartRecord> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(carts)
    .where(
      and(
        eq(carts.workspaceId, workspaceId),
        eq(carts.customerId, customerId),
        eq(carts.status, "active"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [customer] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, customerId),
        eq(users.workspaceId, workspaceId),
        eq(users.role, "customer"),
      ),
    )
    .limit(1);
  if (!customer) {
    throw apiError(404, "NOT_FOUND", "Customer account not found.");
  }

  const digest = createHash("sha256")
    .update(`${workspaceId}:${customerId}`)
    .digest("hex")
    .slice(0, 32);
  await db
    .insert(carts)
    .values({
      id: `cart_${digest}`,
      workspaceId,
      customerId,
      status: "active",
      version: 0,
    })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(carts)
    .where(
      and(
        eq(carts.workspaceId, workspaceId),
        eq(carts.customerId, customerId),
        eq(carts.status, "active"),
      ),
    )
    .limit(1);
  if (!created) throw new Error("Current cart could not be created.");
  return created;
}

export async function getCurrentCart(
  workspaceId: string,
  customerId: string,
): Promise<CartDto> {
  const cart = await ensureCurrentCart(workspaceId, customerId);
  const rows = await getDb()
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      productSlug: products.slug,
      productName: products.name,
      variantName: productVariants.name,
      imageUrls: products.imageUrls,
      quantity: cartItems.quantity,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(eq(cartItems.cartId, cart.id), eq(products.workspaceId, workspaceId)),
    )
    .orderBy(asc(productVariants.id))
    .limit(100);

  const currency = rows[0]?.currency ?? "USD";
  if (rows.some((row) => row.currency !== currency)) {
    throw new Error("A cart cannot contain multiple currencies.");
  }
  const subtotal = rows.reduce(
    (total, row) => total + row.priceCents * row.quantity,
    0,
  );

  return {
    id: cart.id,
    items: rows.map((row) => ({
      variantId: row.variantId,
      sku: row.sku,
      productSlug: row.productSlug,
      productName: row.productName,
      variantName: row.variantName,
      imageUrl: row.imageUrls[0] ?? null,
      quantity: row.quantity,
      unitPrice: { amount: row.priceCents, currency: row.currency },
      lineTotal: {
        amount: row.priceCents * row.quantity,
        currency: row.currency,
      },
    })),
    itemCount: rows.reduce((total, row) => total + row.quantity, 0),
    subtotal: { amount: subtotal, currency },
    version: cart.version,
    updatedAt: cart.updatedAt.toISOString(),
  };
}

export async function setCartItemQuantity(
  workspaceId: string,
  customerId: string,
  variantId: string,
  quantity: number,
): Promise<CartDto> {
  const cart = await ensureCurrentCart(workspaceId, customerId);
  const [variant] = await getDb()
    .select({
      active: productVariants.active,
      productStatus: products.status,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(
      inventory,
      and(
        eq(inventory.variantId, productVariants.id),
        eq(inventory.workspaceId, workspaceId),
      ),
    )
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(products.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!variant) throw apiError(404, "NOT_FOUND", "Variant not found.");

  const [currentItem] = await getDb()
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
    )
    .limit(1);
  if (currentItem?.quantity === quantity || (!currentItem && quantity === 0)) {
    return getCurrentCart(workspaceId, customerId);
  }

  if (quantity > 0 && (!variant.active || variant.productStatus !== "active")) {
    throw apiError(404, "NOT_FOUND", "Variant not found.");
  }

  const available = Math.max(
    0,
    (variant.quantity ?? 0) - (variant.reserved ?? 0),
  );
  if (quantity > available) {
    throw apiError(
      409,
      "OUT_OF_STOCK",
      "The requested quantity is not available.",
    );
  }

  await getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
      )
      .limit(1);

    if (existing?.quantity === quantity || (!existing && quantity === 0))
      return;

    const now = new Date();
    if (quantity === 0) {
      await tx
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.variantId, variantId),
          ),
        );
    } else {
      if (!existing) {
        const [countRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(cartItems)
          .where(eq(cartItems.cartId, cart.id));
        if (Number(countRow?.count ?? 0) >= 100) {
          throw apiError(
            409,
            "CONFLICT",
            "A cart cannot contain more than 100 items.",
          );
        }
      }
      await tx
        .insert(cartItems)
        .values({ cartId: cart.id, variantId, quantity, updatedAt: now })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity, updatedAt: now },
        });
    }

    await tx
      .update(carts)
      .set({
        version: sql`${carts.version} + 1`,
        updatedAt: now,
      })
      .where(eq(carts.id, cart.id));
  });

  return getCurrentCart(workspaceId, customerId);
}
