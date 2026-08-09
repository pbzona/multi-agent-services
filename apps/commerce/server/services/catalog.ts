import type { components } from "@repo/commerce-contract";
import { and, asc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";
import type { z } from "zod";

import { getDb } from "../db/client";
import {
  inventory,
  products,
  productVariants,
  type Product,
} from "../db/schema";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { apiError } from "../utils/errors";
import type {
  productListQuerySchema,
  productUpdateSchema,
} from "../utils/validation";

type ProductDto = components["schemas"]["Product"];
type ProductPageDto = components["schemas"]["ProductPage"];
type ProductListQuery = z.infer<typeof productListQuerySchema>;
type ProductUpdate = z.infer<typeof productUpdateSchema>;

type VariantRow = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  attributes: Record<string, string>;
  quantity: number | null;
  reserved: number | null;
};

function statusValue(value: string): ProductDto["status"] {
  if (value === "active" || value === "draft" || value === "archived") {
    return value;
  }
  throw new Error("Product has an invalid status.");
}

function mapProduct(product: Product, variants: VariantRow[]): ProductDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    status: statusValue(product.status),
    images: product.imageUrls.slice(0, 12).map((url) => ({
      url,
      alt: product.name,
    })),
    variants: variants.slice(0, 100).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      options: Object.entries(variant.attributes)
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(0, 10)
        .map(([name, value]) => ({ name, value })),
      price: {
        amount: variant.priceCents,
        currency: variant.currency,
      },
      availableQuantity: Math.max(
        0,
        (variant.quantity ?? 0) - (variant.reserved ?? 0),
      ),
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function loadVariants(
  workspaceId: string,
  productIds: string[],
): Promise<Map<string, VariantRow[]>> {
  const variantsByProduct = new Map<string, VariantRow[]>();
  if (productIds.length === 0) return variantsByProduct;

  const rows = await getDb()
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      name: productVariants.name,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
      attributes: productVariants.attributes,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
    })
    .from(productVariants)
    .leftJoin(
      inventory,
      and(
        eq(inventory.variantId, productVariants.id),
        eq(inventory.workspaceId, workspaceId),
      ),
    )
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.active, true),
      ),
    )
    .orderBy(asc(productVariants.id));

  for (const row of rows) {
    const current = variantsByProduct.get(row.productId) ?? [];
    current.push(row);
    variantsByProduct.set(row.productId, current);
  }
  return variantsByProduct;
}

async function mapProducts(
  workspaceId: string,
  rows: Product[],
): Promise<ProductDto[]> {
  const variants = await loadVariants(
    workspaceId,
    rows.map((product) => product.id),
  );
  return rows.map((product) =>
    mapProduct(product, variants.get(product.id) ?? []),
  );
}

export async function listProducts(
  workspaceId: string,
  query: ProductListQuery,
  includeInactive = false,
): Promise<ProductPageDto> {
  const cursor = decodeCursor(query.cursor, "products");
  const filters = [eq(products.workspaceId, workspaceId)];
  if (!includeInactive) filters.push(eq(products.status, "active"));

  if (cursor) filters.push(gt(products.id, cursor.key));
  if (query.category) filters.push(eq(products.category, query.category));
  if (query.query) {
    const pattern = `%${query.query}%`;
    filters.push(
      or(
        ilike(products.name, pattern),
        ilike(products.slug, pattern),
        sql`exists (
          select 1 from ${productVariants}
          where ${productVariants.productId} = ${products.id}
            and ${productVariants.sku} ilike ${pattern}
        )`,
      )!,
    );
  }
  if (query.inStock) {
    filters.push(sql`exists (
      select 1 from ${productVariants}
      inner join ${inventory}
        on ${inventory.variantId} = ${productVariants.id}
      where ${productVariants.productId} = ${products.id}
        and ${productVariants.active} = true
        and ${inventory.workspaceId} = ${workspaceId}
        and (${inventory.quantity} - ${inventory.reserved}) > 0
    )`);
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(...filters))
    .orderBy(asc(products.id))
    .limit(query.limit + 1);
  const pageRows = rows.slice(0, query.limit);
  const last = pageRows.at(-1);

  return {
    items: await mapProducts(workspaceId, pageRows),
    nextCursor:
      rows.length > query.limit && last
        ? encodeCursor("products", last.id)
        : null,
  };
}

export async function getProductBySlug(
  workspaceId: string,
  slug: string,
  includeInactive = false,
): Promise<ProductDto> {
  const filters = [
    eq(products.workspaceId, workspaceId),
    eq(products.slug, slug),
  ];
  if (!includeInactive) filters.push(eq(products.status, "active"));

  const [product] = await getDb()
    .select()
    .from(products)
    .where(and(...filters))
    .limit(1);

  if (!product) {
    throw apiError(404, "NOT_FOUND", "Product not found.");
  }
  const [result] = await mapProducts(workspaceId, [product]);
  if (!result) throw new Error("Product mapping failed.");
  return result;
}

async function getAdminProduct(
  workspaceId: string,
  productId: string,
): Promise<ProductDto> {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(
      and(eq(products.workspaceId, workspaceId), eq(products.id, productId)),
    )
    .limit(1);

  if (!product) throw apiError(404, "NOT_FOUND", "Product not found.");
  const [result] = await mapProducts(workspaceId, [product]);
  if (!result) throw new Error("Product mapping failed.");
  return result;
}

export async function updateProduct(
  workspaceId: string,
  productId: string,
  input: ProductUpdate,
): Promise<ProductDto> {
  const [current] = await getDb()
    .select()
    .from(products)
    .where(
      and(eq(products.workspaceId, workspaceId), eq(products.id, productId)),
    )
    .limit(1);
  if (!current) throw apiError(404, "NOT_FOUND", "Product not found.");

  const changes: Partial<typeof products.$inferInsert> = {};
  if (input.name !== undefined && input.name !== current.name) {
    changes.name = input.name;
  }
  if (
    input.description !== undefined &&
    input.description !== current.description
  ) {
    changes.description = input.description;
  }
  if (input.category !== undefined && input.category !== current.category) {
    changes.category = input.category;
  }
  if (input.status !== undefined && input.status !== current.status) {
    changes.status = input.status;
  }
  if (
    input.imageUrls !== undefined &&
    JSON.stringify(input.imageUrls) !== JSON.stringify(current.imageUrls)
  ) {
    changes.imageUrls = input.imageUrls;
  }

  if (Object.keys(changes).length === 0) {
    return getAdminProduct(workspaceId, productId);
  }

  await getDb()
    .update(products)
    .set({ ...changes, updatedAt: new Date() })
    .where(
      and(eq(products.workspaceId, workspaceId), eq(products.id, productId)),
    );
  return getAdminProduct(workspaceId, productId);
}
