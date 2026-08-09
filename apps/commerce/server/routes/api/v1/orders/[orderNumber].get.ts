import { defineHandler } from "nitro";
import { getValidatedRouterParams } from "nitro/h3";

import { getCurrentCustomerOrder } from "../../../../services/orders";
import { authorizeRequest } from "../../../../utils/auth";
import {
  orderParamsSchema,
  sanitizedValidationError,
} from "../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["customer"]);
  const { orderNumber } = await getValidatedRouterParams(
    event,
    orderParamsSchema,
    {
      decode: true,
      onError: () => sanitizedValidationError("order number"),
    },
  );
  return getCurrentCustomerOrder(
    principal.workspaceId,
    principal.id,
    orderNumber,
  );
});
