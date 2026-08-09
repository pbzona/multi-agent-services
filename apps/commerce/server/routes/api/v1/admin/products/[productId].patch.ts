import { defineHandler } from "nitro";
import { getValidatedRouterParams, readValidatedBody } from "nitro/h3";

import { updateProduct } from "../../../../../services/catalog";
import { authorizeRequest } from "../../../../../utils/auth";
import {
  assertBoundedJsonBody,
  productParamsSchema,
  productUpdateSchema,
  sanitizedValidationError,
} from "../../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["admin"]);
  const { productId } = await getValidatedRouterParams(
    event,
    productParamsSchema,
    {
      decode: true,
      onError: () => sanitizedValidationError("product identifier"),
    },
  );
  await assertBoundedJsonBody(event, 32 * 1024);
  const input = await readValidatedBody(event, productUpdateSchema, {
    onError: () => sanitizedValidationError("request body"),
  });
  return updateProduct(principal.workspaceId, productId, input);
});
