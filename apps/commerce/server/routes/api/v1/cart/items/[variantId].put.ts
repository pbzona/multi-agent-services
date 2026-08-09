import { defineHandler } from "nitro";
import { getValidatedRouterParams, readValidatedBody } from "nitro/h3";

import { setCartItemQuantity } from "../../../../../services/cart";
import { authorizeRequest } from "../../../../../utils/auth";
import {
  assertBoundedJsonBody,
  cartItemSetSchema,
  sanitizedValidationError,
  variantParamsSchema,
} from "../../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["customer"]);
  const { variantId } = await getValidatedRouterParams(
    event,
    variantParamsSchema,
    {
      decode: true,
      onError: () => sanitizedValidationError("variant identifier"),
    },
  );
  await assertBoundedJsonBody(event, 16 * 1024);
  const input = await readValidatedBody(event, cartItemSetSchema, {
    onError: () => sanitizedValidationError("request body"),
  });
  return setCartItemQuantity(
    principal.workspaceId,
    principal.id,
    variantId,
    input.quantity,
  );
});
