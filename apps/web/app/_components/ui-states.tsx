import Link from "next/link";
import { ArrowIcon } from "./icons";

export function EmptyState({
  actionHref = "/",
  actionLabel = "Browse the catalog",
  description,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
}) {
  return (
    <section className="empty-state">
      <span aria-hidden="true" className="empty-mark">
        []
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button button-secondary" href={actionHref}>
        {actionLabel}
        <ArrowIcon />
      </Link>
    </section>
  );
}

export function ServiceError({
  label = "commerce service",
}: {
  label?: string;
}) {
  return (
    <section className="inline-error" role="alert">
      <p className="eyebrow">Service unavailable</p>
      <h2>We couldn&apos;t reach the {label}.</h2>
      <p>Refresh the page after the service becomes available.</p>
    </section>
  );
}
