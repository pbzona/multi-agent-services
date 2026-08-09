"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-shell inline-error" role="alert">
      <p className="eyebrow">Unexpected error</p>
      <h1>That page could not be loaded.</h1>
      <p>
        The request did not complete. You can retry without losing your demo
        session.
      </p>
      <button className="button button-primary" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}
