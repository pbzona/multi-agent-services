import { defineHandler } from "nitro";
import { getValidatedRouterParams, readValidatedBody } from "nitro/h3";

import { setInventoryLevel } from "../../../../../services/inventory";
import { authorizeRequest } from "../../../../../utils/auth";
import {
  assertBoundedJsonBody,
  inventorySetSchema,
  sanitizedValidationError,
  variantParamsSchema,
} from "../../../../../utils/validation";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["admin"]);
  const { variantId } = await getValidatedRouterParams(
    event,
    variantParamsSchema,
    {
      decode: true,
      onError: () => sanitizedValidationError("variant identifier"),
    },
  );
  await assertBoundedJsonBody(event, 16 * 1024);
  const input = await readValidatedBody(event, inventorySetSchema, {
    onError: () => sanitizedValidationError("request body"),
  });
  return setInventoryLevel(principal.workspaceId, variantId, input);
});
