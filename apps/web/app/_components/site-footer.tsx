import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <span className="wordmark footer-wordmark">FIELD / FORM</span>
          <p>Useful objects. Quietly considered.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/#catalog">Catalog</Link>
          <Link href="/account/orders">Orders</Link>
          <Link href="/cart">Cart</Link>
        </nav>
        <p className="footer-note">Reference shop / No checkout</p>
      </div>
    </footer>
  );
}
