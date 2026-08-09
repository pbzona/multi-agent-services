import { eq, inArray, sql } from "drizzle-orm";

import { closeDb, getDb } from "./client.ts";
import {
  seedCartItems,
  seedCarts,
  seedInventory,
  seedOrderItems,
  seedOrders,
  seedProducts,
  seedUsers,
  seedVariants,
  seedWorkspaces,
  SEED_CART_ID,
} from "./seed-data.ts";
import {
  cartItems,
  carts,
  inventory,
  orderItems,
  orders,
  products,
  productVariants,
  users,
  workspaces,
} from "./schema.ts";

async function seed(): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .insert(workspaces)
      .values(seedWorkspaces)
      .onConflictDoUpdate({
        target: workspaces.id,
        set: {
          name: sql`excluded.name`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    await tx
      .insert(users)
      .values(seedUsers)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          workspaceId: sql`excluded.workspace_id`,
          email: sql`excluded.email`,
          name: sql`excluded.name`,
          role: sql`excluded.role`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    await tx
      .insert(products)
      .values(seedProducts)
      .onConflictDoUpdate({
        target: products.id,
        set: {
          workspaceId: sql`excluded.workspace_id`,
          slug: sql`excluded.slug`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          category: sql`excluded.category`,
          imageUrls: sql`excluded.image_urls`,
          status: sql`excluded.status`,
          featured: sql`excluded.featured`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    await tx
      .insert(productVariants)
      .values(seedVariants)
      .onConflictDoUpdate({
        target: productVariants.id,
        set: {
          productId: sql`excluded.product_id`,
          sku: sql`excluded.sku`,
          name: sql`excluded.name`,
          priceCents: sql`excluded.price_cents`,
          currency: sql`excluded.currency`,
          attributes: sql`excluded.attributes`,
          active: sql`excluded.active`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    await tx
      .insert(inventory)
      .values(seedInventory)
      .onConflictDoUpdate({
        target: inventory.variantId,
        set: {
          workspaceId: sql`excluded.workspace_id`,
          quantity: sql`excluded.quantity`,
          reserved: sql`excluded.reserved`,
          lowStockThreshold: sql`excluded.low_stock_threshold`,
          state: sql`excluded.state`,
          version: sql`excluded.version`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    await tx
      .insert(carts)
      .values(seedCarts)
      .onConflictDoUpdate({
        target: carts.id,
        set: {
          workspaceId: sql`excluded.workspace_id`,
          customerId: sql`excluded.customer_id`,
          status: sql`excluded.status`,
          version: sql`excluded.version`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
    await tx.delete(cartItems).where(eq(cartItems.cartId, SEED_CART_ID));
    await tx.insert(cartItems).values(seedCartItems);

    await tx
      .insert(orders)
      .values(seedOrders)
      .onConflictDoUpdate({
        target: orders.id,
        set: {
          workspaceId: sql`excluded.workspace_id`,
          customerId: sql`excluded.customer_id`,
          number: sql`excluded.number`,
          status: sql`excluded.status`,
          currency: sql`excluded.currency`,
          subtotalCents: sql`excluded.subtotal_cents`,
          shippingCents: sql`excluded.shipping_cents`,
          taxCents: sql`excluded.tax_cents`,
          totalCents: sql`excluded.total_cents`,
          placedAt: sql`excluded.placed_at`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    const orderIds = seedOrders.map((order) => order.id);
    await tx.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    await tx.insert(orderItems).values(seedOrderItems);
  });
}

try {
  await seed();
  console.log(
    `Seeded ${seedProducts.length} products, ${seedVariants.length} variants, and ${seedOrders.length} orders.`,
  );
} catch (error) {
  console.error("Commerce seed failed.", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
