import commerceOpenApiDocument from "./openapi.generated.json" with { type: "json" };

export type { components, operations, paths } from "./openapi.generated.js";

export const commerceOpenApi = commerceOpenApiDocument;

export type CommerceOpenApi = typeof commerceOpenApi;

export function withCommerceServer(url?: string): CommerceOpenApi {
  return {
    ...commerceOpenApi,
    servers: url ? [{ url }] : [],
  };
}
