import Link from "next/link";
import type { Product, ProductVariant } from "../_lib/commerce";
import { formatMoney, titleCase } from "../_lib/format";
import { ProductArtwork } from "./product-artwork";

export function ProductCard({ product }: { product: Product }) {
  const lowestVariant = product.variants.reduce<ProductVariant | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.price.amount ? variant : lowest,
    undefined,
  );
  const available = product.variants.reduce(
    (total: number, variant: ProductVariant) =>
      total + variant.availableQuantity,
    0,
  );

  return (
    <article className="product-card">
      <Link className="product-card-link" href={`/products/${product.slug}`}>
        <ProductArtwork
          imageUrl={product.images[0]?.url}
          name={product.name}
          slug={product.slug}
        />
        <div className="product-card-copy">
          <h3>{product.name}</h3>
          <span className="product-card-price">
            {lowestVariant
              ? formatMoney(
                  lowestVariant.price.amount,
                  lowestVariant.price.currency,
                )
              : "-"}
          </span>
          <span className="product-card-category">
            {titleCase(product.category)}
          </span>
          <span className="product-card-stock">
            {available > 0 ? "In stock" : "Unavailable"}
          </span>
        </div>
      </Link>
    </article>
  );
}
