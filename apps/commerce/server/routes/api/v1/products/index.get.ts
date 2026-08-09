import { defineHandler } from "nitro";
import { getValidatedQuery } from "nitro/h3";

import { listProducts } from "../../../../services/catalog";
import { authorizeRequest } from "../../../../utils/auth";
import {
  productListQuerySchema,
  sanitizedValidationError,
} from "../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["web", "customer", "admin"]);
  const query = await getValidatedQuery(event, productListQuerySchema, {
    onError: () => sanitizedValidationError("query parameters"),
  });
  return listProducts(principal.workspaceId, query, principal.role === "admin");
});
