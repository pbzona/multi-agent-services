import Link from "next/link";
import { ArrowIcon } from "./_components/icons";

export default function NotFound() {
  return (
    <div className="page-shell empty-state">
      <span aria-hidden="true" className="empty-mark">
        404
      </span>
      <h1>This object isn&apos;t here.</h1>
      <p>
        The product or order may have moved, or it may not belong to the active
        demo customer.
      </p>
      <Link className="button button-secondary" href="/">
        Return to the catalog
        <ArrowIcon />
      </Link>
    </div>
  );
}
