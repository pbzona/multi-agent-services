import { defineHandler } from "nitro";
import { getValidatedRouterParams } from "nitro/h3";

import { getProductBySlug } from "../../../../services/catalog";
import { authorizeRequest } from "../../../../utils/auth";
import {
  productSlugParamsSchema,
  sanitizedValidationError,
} from "../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["web", "customer", "admin"]);
  const { slug } = await getValidatedRouterParams(
    event,
    productSlugParamsSchema,
    {
      decode: true,
      onError: () => sanitizedValidationError("product slug"),
    },
  );
  return getProductBySlug(
    principal.workspaceId,
    slug,
    principal.role === "admin",
  );
});
