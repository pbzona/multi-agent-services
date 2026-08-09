import Link from "next/link";
import { listProducts, type Product } from "./_lib/commerce";
import { ProductArtwork } from "./_components/product-artwork";
import { ProductCard } from "./_components/product-card";
import { ArrowIcon } from "./_components/icons";
import { EmptyState, ServiceError } from "./_components/ui-states";

export const dynamic = "force-dynamic";

const HERO_FALLBACK = {
  name: "Horizon Standing Desk",
  slug: "horizon-standing-desk",
};

export default async function HomePage() {
  let products: Product[] = [];
  let loadFailed = false;

  try {
    products = await listProducts();
  } catch {
    loadFailed = true;
  }

  const heroProduct = products[0] ?? HERO_FALLBACK;

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Desk / Home - Edition 01</p>
            <h1 className="display-title">Objects for focused rooms.</h1>
            <p>
              A concise collection for the places where work and daily life
              meet. Useful, durable, and deliberately quiet.
            </p>
            <Link className="button button-primary" href="#catalog">
              View the collection
              <ArrowIcon />
            </Link>
          </div>
          <div className="hero-visual">
            <ProductArtwork
              name={heroProduct.name}
              size="detail"
              slug={heroProduct.slug}
            />
            <div className="hero-index">
              <span>Form 001</span>
              <span>{heroProduct.name}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-section page-shell" id="catalog">
        <div className="section-heading">
          <div className="section-heading-copy">
            <p className="eyebrow">Current collection</p>
            <h2 className="section-title">Desk and home</h2>
          </div>
          <span className="section-count">
            {products.length || "-"} objects
          </span>
        </div>

        {loadFailed ? <ServiceError /> : null}
        {!loadFailed && products.length === 0 ? (
          <EmptyState
            actionHref="/"
            actionLabel="Refresh catalog"
            description="The collection is being prepared. Check back shortly."
            title="No objects are published yet"
          />
        ) : null}
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        <div className="store-values">
          <article className="store-value">
            <span className="store-value-index">01 / Utility</span>
            <h3>Made for daily use</h3>
            <p>
              Simple materials and repairable details, selected for years rather
              than seasons.
            </p>
          </article>
          <article className="store-value">
            <span className="store-value-index">02 / Scale</span>
            <h3>Room-conscious</h3>
            <p>
              Proportions that work in a dedicated studio or at the edge of a
              living room.
            </p>
          </article>
          <article className="store-value">
            <span className="store-value-index">03 / Support</span>
            <h3>Ask before deciding</h3>
            <p>
              Use the store agent to compare options, check stock, or update
              your cart.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
