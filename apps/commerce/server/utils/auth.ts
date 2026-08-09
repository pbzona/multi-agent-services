import {
  verifyCommerceAccessToken,
  type CommercePrincipal,
  type CommerceRole,
} from "@repo/demo-auth";
import { HTTPError, type H3Event } from "nitro/h3";
import { z } from "zod";

const principalSchema = z.object({
  id: z.string().min(1).max(128),
  role: z.enum(["web", "customer", "admin"]),
  workspaceId: z.string().min(1).max(128),
});

const unauthorized = () =>
  new HTTPError({
    status: 401,
    statusText: "Unauthorized",
    message: "Authentication required.",
    headers: { "www-authenticate": 'Bearer realm="commerce"' },
  });

export function readBearerToken(headers: Headers): string {
  const authorization = headers.get("authorization");
  if (!authorization || authorization.length > 4200) throw unauthorized();

  const match = /^Bearer[\t ]+([A-Za-z0-9._~-]+)$/i.exec(authorization);
  const token = match?.[1];
  if (!token || token.length > 4096) throw unauthorized();
  return token;
}

export async function authorizeRequest(
  event: H3Event,
  allowedRoles: readonly CommerceRole[],
): Promise<CommercePrincipal> {
  const context = event.context as {
    commercePrincipal?: CommercePrincipal;
  };

  let principal = context.commercePrincipal;
  if (!principal) {
    try {
      const verified = await verifyCommerceAccessToken(
        readBearerToken(event.req.headers),
      );
      const parsed = principalSchema.safeParse(verified);
      if (!parsed.success) throw unauthorized();
      principal = parsed.data;
      context.commercePrincipal = principal;
    } catch (error) {
      if (HTTPError.isError(error)) throw error;
      throw unauthorized();
    }
  }

  if (!allowedRoles.includes(principal.role)) {
    throw new HTTPError({
      status: 403,
      statusText: "Forbidden",
      message: "This token cannot access the requested resource.",
    });
  }

  return principal;
}
