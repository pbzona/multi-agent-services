import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon } from "../../../_components/icons";
import { ProductArtwork } from "../../../_components/product-artwork";
import { ServiceError } from "../../../_components/ui-states";
import { CommerceError, getOrder, type Order } from "../../../_lib/commerce";
import { formatDate, formatMoney, titleCase } from "../../../_lib/format";

export const dynamic = "force-dynamic";

type OrderPageProps = { params: Promise<{ number: string }> };

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  return { title: `Order ${(await params).number}` };
}

const TIMELINE = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;

export default async function OrderPage({ params }: OrderPageProps) {
  const { number } = await params;
  let order: Order;

  try {
    order = await getOrder(number);
  } catch (cause) {
    if (cause instanceof CommerceError && cause.status === 404) notFound();
    return (
      <div className="page-shell">
        <ServiceError label="orders service" />
      </div>
    );
  }

  const currentTimelineIndex = TIMELINE.findIndex(
    (status) => status === order.status,
  );

  return (
    <div className="page-shell">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/account/orders">Orders</Link>
        <ChevronIcon />
        <span>{order.orderNumber}</span>
      </nav>
      <header className="page-header">
        <div>
          <p className="eyebrow">Placed {formatDate(order.placedAt)}</p>
          <h1 className="page-title">Order {order.orderNumber}</h1>
        </div>
        <span className="status-pill">{titleCase(order.status)}</span>
      </header>

      <div className="order-detail-grid">
        <section className="order-items">
          <h2>Objects in this order</h2>
          {order.items.map((item: Order["items"][number]) => (
            <article className="order-item" key={item.variantId}>
              <Link href={`/products/${item.productSlug}`}>
                <ProductArtwork
                  name={item.productName}
                  size="mini"
                  slug={item.productSlug}
                />
              </Link>
              <div className="order-item-copy">
                <h3>
                  <Link href={`/products/${item.productSlug}`}>
                    {item.productName}
                  </Link>
                </h3>
                <p>
                  {item.variantName} / Qty {item.quantity}
                </p>
              </div>
              <span>
                {formatMoney(item.lineTotal.amount, item.lineTotal.currency)}
              </span>
            </article>
          ))}
        </section>

        <aside className="order-sidebar">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>
              {formatMoney(order.subtotal.amount, order.subtotal.currency)}
            </span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>
              {formatMoney(order.shipping.amount, order.shipping.currency)}
            </span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>{formatMoney(order.tax.amount, order.tax.currency)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatMoney(order.total.amount, order.total.currency)}</span>
          </div>

          <ol aria-label="Order progress" className="order-timeline">
            {order.status === "cancelled" ? (
              <li className="is-current">Cancelled</li>
            ) : (
              TIMELINE.map((status, index) => (
                <li
                  className={index <= currentTimelineIndex ? "is-current" : ""}
                  key={status}
                >
                  {titleCase(status)}
                </li>
              ))
            )}
          </ol>
        </aside>
      </div>
    </div>
  );
}
