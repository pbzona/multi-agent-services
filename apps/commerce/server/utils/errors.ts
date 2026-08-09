import { HTTPError } from "nitro/h3";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "OUT_OF_STOCK"
  | "VERSION_MISMATCH";

const statusCodes: Partial<Record<number, ApiErrorCode>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

export function apiError(
  status: 400 | 401 | 403 | 404 | 409,
  code: ApiErrorCode,
  message: string,
  headers?: HeadersInit,
): HTTPError {
  return new HTTPError({
    status,
    message: message.slice(0, 500),
    data: { code },
    headers,
  });
}

export function formatApiError(error: HTTPError, requestId: string) {
  const data = error.data as { code?: unknown } | undefined;
  const explicitCode =
    typeof data?.code === "string" && data.code.length <= 32
      ? data.code
      : undefined;
  const unhandled = error.unhandled || error.status >= 500;

  return {
    status: unhandled ? 500 : error.status,
    body: {
      error: {
        code:
          explicitCode ?? statusCodes[error.status] ?? "COMMERCE_UNAVAILABLE",
        message: unhandled
          ? "Commerce service is temporarily unavailable."
          : error.message.slice(0, 500) || "Request failed.",
        requestId: requestId.slice(0, 128),
      },
    },
  };
}
