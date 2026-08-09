import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_workspace_email_unique").on(
      table.workspaceId,
      table.email,
    ),
    index("users_workspace_role_idx").on(table.workspaceId, table.role),
    check("users_role_check", sql`${table.role} in ('customer', 'admin')`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    imageUrls: jsonb("image_urls").$type<string[]>().default([]).notNull(),
    status: text("status").default("active").notNull(),
    featured: boolean("featured").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_workspace_slug_unique").on(
      table.workspaceId,
      table.slug,
    ),
    index("products_workspace_status_idx").on(table.workspaceId, table.status),
    check(
      "products_status_check",
      sql`${table.status} in ('active', 'draft', 'archived')`,
    ),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    attributes: jsonb("attributes")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("product_variants_product_idx").on(table.productId),
    check("product_variants_price_check", sql`${table.priceCents} >= 0`),
    check(
      "product_variants_currency_check",
      sql`char_length(${table.currency}) = 3`,
    ),
  ],
);

export const inventory = pgTable(
  "inventory",
  {
    variantId: text("variant_id")
      .primaryKey()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    reserved: integer("reserved").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    state: text("state").notNull(),
    version: integer("version").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inventory_workspace_state_idx").on(table.workspaceId, table.state),
    check("inventory_quantity_check", sql`${table.quantity} >= 0`),
    check("inventory_reserved_check", sql`${table.reserved} >= 0`),
    check(
      "inventory_low_stock_threshold_check",
      sql`${table.lowStockThreshold} >= 0`,
    ),
    check(
      "inventory_reserved_quantity_check",
      sql`${table.reserved} <= ${table.quantity}`,
    ),
    check("inventory_version_check", sql`${table.version} > 0`),
    check(
      "inventory_state_check",
      sql`${table.state} in ('in_stock', 'low_stock', 'out_of_stock', 'backorder')`,
    ),
  ],
);

export const carts = pgTable(
  "carts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").default("active").notNull(),
    version: integer("version").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("carts_one_active_per_customer_unique")
      .on(table.workspaceId, table.customerId)
      .where(sql`${table.status} = 'active'`),
    check(
      "carts_status_check",
      sql`${table.status} in ('active', 'converted', 'abandoned')`,
    ),
    check("carts_version_check", sql`${table.version} >= 0`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.cartId, table.variantId] }),
    check("cart_items_quantity_check", sql`${table.quantity} > 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    number: text("number").notNull(),
    status: text("status").notNull(),
    currency: text("currency").default("USD").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_workspace_number_unique").on(
      table.workspaceId,
      table.number,
    ),
    index("orders_customer_placed_idx").on(table.customerId, table.placedAt),
    check(
      "orders_status_check",
      sql`${table.status} in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')`,
    ),
    check("orders_subtotal_check", sql`${table.subtotalCents} >= 0`),
    check("orders_shipping_check", sql`${table.shippingCents} >= 0`),
    check("orders_tax_check", sql`${table.taxCents} >= 0`),
    check("orders_total_check", sql`${table.totalCents} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    variantName: text("variant_name").notNull(),
    sku: text("sku").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_check", sql`${table.quantity} > 0`),
    check("order_items_unit_price_check", sql`${table.unitPriceCents} >= 0`),
    check("order_items_line_total_check", sql`${table.lineTotalCents} >= 0`),
  ],
);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type Order = typeof orders.$inferSelect;
