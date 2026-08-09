import { defineHandler } from "nitro";

import { getCurrentCart } from "../../../../services/cart";
import { authorizeRequest } from "../../../../utils/auth";

export default defineHandler(async (event) => {
  const principal = await authorizeRequest(event, ["customer"]);
  return getCurrentCart(principal.workspaceId, principal.id);
});
