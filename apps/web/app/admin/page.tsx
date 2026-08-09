import type { Metadata } from "next";
import { AdminAgentPanel } from "../_components/agent-panel";
import { PersonaSwitcher } from "../_components/persona-switcher";
import { ServiceError } from "../_components/ui-states";
import { listInventory, type InventoryItem } from "../_lib/commerce";
import { formatDate, titleCase } from "../_lib/format";
import { getDemoPrincipal } from "../_lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory control",
  description:
    "Role-gated inventory operations for the Field & Form reference store.",
};

function InventoryTable({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <div className="inventory-table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th scope="col">Product / variant</th>
            <th scope="col">SKU</th>
            <th scope="col">On hand</th>
            <th scope="col">Reserved</th>
            <th scope="col">State</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const lowStock = item.state === "low_stock";
            const barWidth = Math.min(
              100,
              Math.round(
                (item.availableQuantity /
                  Math.max(item.lowStockThreshold * 4, 20)) *
                  100,
              ),
            );
            return (
              <tr key={item.variantId}>
                <td>
                  <div className="inventory-product">
                    <span aria-hidden="true" className="inventory-product-mark">
                      {item.productName[0]}
                    </span>
                    <span>
                      <strong>{item.productName}</strong>
                      <span>{item.variantName}</span>
                    </span>
                  </div>
                </td>
                <td className="inventory-sku">{item.sku}</td>
                <td>
                  <span className="inventory-quantity">{item.quantity}</span>
                  <div aria-hidden="true" className="stock-bar">
                    <span style={{ width: `${barWidth}%` }} />
                  </div>
                </td>
                <td className="inventory-quantity">{item.reservedQuantity}</td>
                <td>
                  <span className="status-pill">
                    {item.state === "backorder"
                      ? "Backorder"
                      : item.state === "out_of_stock"
                        ? "Out of stock"
                        : lowStock
                          ? "Low stock"
                          : "In stock"}
                  </span>
                </td>
                <td className="inventory-sku">{formatDate(item.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  const principal = await getDemoPrincipal();

  if (principal.role !== "admin") {
    return (
      <div className="page-shell role-gate">
        <span aria-hidden="true" className="role-gate-mark">
          A
        </span>
        <h1>Admin access required</h1>
        <p>
          The inventory workspace is restricted to the signed admin persona.
        </p>
        <PersonaSwitcher role={principal.role} />
      </div>
    );
  }

  let inventory: InventoryItem[] = [];
  let inventoryFailed = false;
  try {
    inventory = await listInventory();
  } catch {
    inventoryFailed = true;
  }

  const lowStockCount = inventory.filter(
    (item) => item.availableQuantity <= item.lowStockThreshold,
  ).length;

  return (
    <div className="page-shell admin-shell">
      <header className="admin-hero">
        <div>
          <p className="eyebrow">Operations / {titleCase(principal.role)}</p>
          <h1 className="page-title">Inventory control</h1>
        </div>
        <p className="admin-identity">Signed in as {principal.email}</p>
      </header>

      <div className="admin-layout">
        <section className="inventory-section">
          <div className="inventory-heading">
            <h2>Live inventory</h2>
            <p>
              {lowStockCount} need attention / {inventory.length} variants
            </p>
          </div>
          {inventoryFailed ? <ServiceError label="inventory service" /> : null}
          {!inventoryFailed && inventory.length === 0 ? (
            <p className="inline-error">No inventory records are available.</p>
          ) : null}
          {inventory.length > 0 ? (
            <InventoryTable inventory={inventory} />
          ) : null}
        </section>
        <AdminAgentPanel />
      </div>
    </div>
  );
}
