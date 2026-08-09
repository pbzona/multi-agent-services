import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "../../_components/cart-actions";
import { CheckIcon, ChevronIcon } from "../../_components/icons";
import { ProductArtwork } from "../../_components/product-artwork";
import { ServiceError } from "../../_components/ui-states";
import {
  CommerceError,
  getProduct,
  type Product,
  type ProductVariant,
} from "../../_lib/commerce";
import { formatMoney, titleCase } from "../../_lib/format";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getProduct((await params).slug);
    return { title: product.name, description: product.description };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Product;

  try {
    product = await getProduct(slug);
  } catch (cause) {
    if (cause instanceof CommerceError && cause.status === 404) notFound();
    return (
      <div className="page-shell">
        <ServiceError />
      </div>
    );
  }

  const lowestVariant = product.variants.reduce<ProductVariant | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.price.amount ? variant : lowest,
    undefined,
  );

  return (
    <div className="page-shell">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Catalog</Link>
        <ChevronIcon />
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail-visual">
          <ProductArtwork
            imageUrl={product.images[0]?.url}
            name={product.name}
            size="detail"
            slug={product.slug}
          />
        </div>
        <section className="product-detail-copy">
          <p className="eyebrow">{titleCase(product.category)}</p>
          <h1 className="page-title">{product.name}</h1>
          <p className="detail-price">
            {lowestVariant
              ? `${product.variants.length > 1 ? "From " : ""}${formatMoney(lowestVariant.price.amount, lowestVariant.price.currency)}`
              : "Price unavailable"}
          </p>
          <p className="detail-description">{product.description}</p>

          <AddToCartForm variants={product.variants} />

          <ul className="detail-notes">
            <li>
              <CheckIcon /> Live inventory checked before every cart update
            </li>
            <li>
              <CheckIcon /> Selected for long-term, everyday use
            </li>
            <li>
              <CheckIcon /> Reference store only - no checkout or payment
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
