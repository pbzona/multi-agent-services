import type { Metadata } from "next";
import Link from "next/link";
import { CartQuantityControl } from "../_components/cart-actions";
import { CheckIcon } from "../_components/icons";
import { PersonaSwitcher } from "../_components/persona-switcher";
import { ProductArtwork } from "../_components/product-artwork";
import { EmptyState, ServiceError } from "../_components/ui-states";
import { getCart, type Cart, type CartItem } from "../_lib/commerce";
import { formatMoney } from "../_lib/format";
import { getDemoPrincipal } from "../_lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the objects in your Field & Form cart.",
};

export default async function CartPage() {
  const principal = await getDemoPrincipal();

  if (principal.role !== "customer") {
    return (
      <div className="page-shell role-gate">
        <span aria-hidden="true" className="role-gate-mark">
          C
        </span>
        <h1>Customer cart</h1>
        <p>Switch to the customer persona to view Avery&apos;s active cart.</p>
        <PersonaSwitcher role={principal.role} />
      </div>
    );
  }

  let cart: Cart;
  try {
    cart = await getCart();
  } catch {
    return (
      <div className="page-shell">
        <ServiceError label="cart service" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Customer / {principal.name}</p>
          <h1 className="page-title">Your cart</h1>
        </div>
        <p className="page-header-meta">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
        </p>
      </header>

      {cart.items.length === 0 ? (
        <EmptyState
          description="The collection is ready when you are. You can also ask the store agent for a recommendation."
          title="Your cart is empty"
        />
      ) : (
        <div className="cart-layout">
          <ul className="cart-list">
            {cart.items.map((item: CartItem) => (
              <li className="cart-item" key={item.variantId}>
                <Link href={`/products/${item.productSlug}`}>
                  <ProductArtwork
                    imageUrl={item.imageUrl}
                    name={item.productName}
                    size="mini"
                    slug={item.productSlug}
                  />
                </Link>
                <div className="cart-item-copy">
                  <h2>
                    <Link href={`/products/${item.productSlug}`}>
                      {item.productName}
                    </Link>
                  </h2>
                  <p>
                    {item.variantName} / {item.sku}
                  </p>
                </div>
                <div className="cart-item-actions">
                  <span className="cart-line-price">
                    {formatMoney(
                      item.lineTotal.amount,
                      item.lineTotal.currency,
                    )}
                  </span>
                  <CartQuantityControl
                    name={item.productName}
                    quantity={item.quantity}
                    variantId={item.variantId}
                  />
                </div>
              </li>
            ))}
          </ul>

          <aside className="cart-summary">
            <h2>Summary</h2>
            <div className="summary-row">
              <span>Objects</span>
              <span>{cart.itemCount}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Subtotal</span>
              <span>
                {formatMoney(cart.subtotal.amount, cart.subtotal.currency)}
              </span>
            </div>
            <div className="reference-notice">
              <CheckIcon />
              <p>
                This is a reference experience. Checkout and payment are
                intentionally not available.
              </p>
            </div>
            <p className="cart-summary-note">
              Need to change several items? Ask the store agent and approve its
              proposed cart update.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
