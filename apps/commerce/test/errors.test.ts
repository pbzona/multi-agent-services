import { HTTPError } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { formatApiError } from "../server/utils/errors";

describe("sanitized API errors", () => {
  it("preserves bounded explicit contract errors", () => {
    const formatted = formatApiError(
      new HTTPError({
        status: 409,
        message: "Refresh and retry.",
        data: { code: "VERSION_MISMATCH" },
      }),
      "req_123",
    );
    expect(formatted).toEqual({
      status: 409,
      body: {
        error: {
          code: "VERSION_MISMATCH",
          message: "Refresh and retry.",
          requestId: "req_123",
        },
      },
    });
  });

  it("does not expose unhandled error messages", () => {
    const error = new HTTPError({
      status: 500,
      message: "postgres://secret@internal/database",
      unhandled: true,
    });
    expect(formatApiError(error, "req_456").body.error.message).toBe(
      "Commerce service is temporarily unavailable.",
    );
  });
});
