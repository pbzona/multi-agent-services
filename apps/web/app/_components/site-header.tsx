import type { DemoPrincipal } from "@repo/demo-auth";
import Link from "next/link";
import { BagIcon, UserIcon } from "./icons";
import { PersonaSwitcher } from "./persona-switcher";

export function SiteHeader({ principal }: { principal: DemoPrincipal }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="Field and Form home" className="wordmark" href="/">
          <span className="wordmark-mark" aria-hidden="true">
            F
          </span>
          <span>FIELD / FORM</span>
        </Link>

        <nav aria-label="Primary" className="primary-nav">
          <Link href="/#catalog">Shop</Link>
          {principal.role === "customer" ? (
            <Link href="/account/orders">Orders</Link>
          ) : null}
          {principal.role === "admin" ? (
            <Link href="/admin">Inventory</Link>
          ) : null}
        </nav>

        <div className="header-actions">
          <PersonaSwitcher role={principal.role} />
          <Link
            aria-label={`${principal.name}'s ${principal.role === "admin" ? "admin workspace" : "orders"}`}
            className="icon-link account-link"
            href={principal.role === "admin" ? "/admin" : "/account/orders"}
          >
            <UserIcon />
            <span className="header-name">{principal.name.split(" ")[0]}</span>
          </Link>
          {principal.role === "customer" ? (
            <Link aria-label="View cart" className="icon-link" href="/cart">
              <BagIcon />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
