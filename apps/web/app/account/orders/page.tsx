import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "../../_components/icons";
import { PersonaSwitcher } from "../../_components/persona-switcher";
import { EmptyState, ServiceError } from "../../_components/ui-states";
import { listOrders, type Order } from "../../_lib/commerce";
import { formatDate, formatMoney, titleCase } from "../../_lib/format";
import { getDemoPrincipal } from "../../_lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  description: "Order history for the active demo customer.",
};

export default async function OrdersPage() {
  const principal = await getDemoPrincipal();

  if (principal.role !== "customer") {
    return (
      <div className="page-shell role-gate">
        <span aria-hidden="true" className="role-gate-mark">
          C
        </span>
        <h1>Customer orders</h1>
        <p>
          Switch to the customer persona to view Avery&apos;s order history.
        </p>
        <PersonaSwitcher role={principal.role} />
      </div>
    );
  }

  let orders: Order[];
  try {
    orders = await listOrders();
  } catch {
    return (
      <div className="page-shell">
        <ServiceError label="orders service" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Account / {principal.name}</p>
          <h1 className="page-title">Orders</h1>
        </div>
        <p className="page-header-meta">{orders.length} recorded</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          description="Completed and in-progress orders will appear here."
          title="No orders yet"
        />
      ) : (
        <div className="orders-list">
          {orders.map((order: Order) => (
            <Link
              className="order-row"
              href={`/account/orders/${order.orderNumber}`}
              key={order.orderNumber}
            >
              <div>
                <span className="order-row-label">Order</span>
                <span className="order-number">{order.orderNumber}</span>
              </div>
              <div>
                <span className="order-row-label">Placed</span>
                <span className="order-row-value">
                  {formatDate(order.placedAt)}
                </span>
              </div>
              <div>
                <span className="order-row-label">Total</span>
                <span className="order-row-value">
                  {formatMoney(order.total.amount, order.total.currency)}
                </span>
              </div>
              <span className="status-pill">{titleCase(order.status)}</span>
              <ChevronIcon />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
