import { defineHandler } from "nitro";
import { getValidatedQuery } from "nitro/h3";

import { listInventory } from "../../../../../services/inventory";
import { authorizeRequest } from "../../../../../utils/auth";
import {
  inventoryListQuerySchema,
  sanitizedValidationError,
} from "../../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["admin"]);
  const query = await getValidatedQuery(event, inventoryListQuerySchema, {
    onError: () => sanitizedValidationError("query parameters"),
  });
  return listInventory(principal.workspaceId, query);
});
