import { defineErrorHandler } from "nitro";

import { formatApiError } from "./utils/errors";

export default defineErrorHandler((error) => {
  const formatted = formatApiError(error, crypto.randomUUID());
  const headers = new Headers(error.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-request-id", formatted.body.error.requestId);

  return Response.json(formatted.body, {
    status: formatted.status,
    headers,
  });
});
