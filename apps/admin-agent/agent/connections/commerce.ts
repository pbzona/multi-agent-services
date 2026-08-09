import { withCommerceServer } from "@repo/commerce-contract";
import { createCommerceAccessToken } from "@repo/demo-auth";
import { defineOpenAPIConnection } from "eve/connections";

const commerceOpenApi = withCommerceServer(process.env.COMMERCE_URL);
const TOKEN_TTL_MS = 5 * 60 * 1000;

const readOperations = new Set(["listProducts", "getProduct", "listInventory"]);
const writeOperations = new Set(["updateProduct", "setInventoryLevel"]);

function operationId(toolName: string): string {
  const separator = toolName.lastIndexOf("__");
  return separator === -1 ? toolName : toolName.slice(separator + 2);
}

export default defineOpenAPIConnection({
  spec: commerceOpenApi,
  description:
    "Authenticated commerce administration API for products and inventory.",
  operations: {
    allow: [
      "listProducts",
      "getProduct",
      "listInventory",
      "updateProduct",
      "setInventoryLevel",
    ],
  },
  auth: (ctx) => {
    const current = ctx.session.auth.current;
    if (
      !current ||
      current.authenticator !== "demo-session" ||
      current.principalType !== "user"
    ) {
      throw new Error("A verified admin demo session is required.");
    }

    const role = current.attributes.role;
    const workspaceId = current.attributes.workspaceId;
    if (role !== "admin" || typeof workspaceId !== "string") {
      throw new Error("The verified admin session context is invalid.");
    }

    return {
      principalType: "user",
      getToken: async ({ principal }) => {
        if (principal.type !== "user" || principal.id !== current.principalId) {
          throw new Error("The commerce principal does not match the session.");
        }

        return {
          token: await createCommerceAccessToken({
            id: current.principalId,
            role,
            workspaceId,
          }),
          expiresAt: Date.now() + TOKEN_TTL_MS,
        };
      },
    };
  },
  approval: ({ toolName }) => {
    const operation = operationId(toolName);
    if (readOperations.has(operation)) return "not-applicable";
    if (writeOperations.has(operation)) return "user-approval";
    return {
      type: "denied",
      reason: `Commerce operation ${operation} is not allowed for admins.`,
    };
  },
});
