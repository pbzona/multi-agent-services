import { defineHandler } from "nitro";
import { getValidatedQuery } from "nitro/h3";

import { listCurrentCustomerOrders } from "../../../../services/orders";
import { authorizeRequest } from "../../../../utils/auth";
import {
  orderListQuerySchema,
  sanitizedValidationError,
} from "../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["customer"]);
  const query = await getValidatedQuery(event, orderListQuerySchema, {
    onError: () => sanitizedValidationError("query parameters"),
  });
  return listCurrentCustomerOrders(principal.workspaceId, principal.id, query);
});
