import { authenticateDemoRequest } from "@repo/demo-auth";
import { eveChannel } from "eve/channels/eve";
import {
  ForbiddenError,
  localDev,
  vercelOidc,
  type AuthFn,
} from "eve/channels/auth";

const customerSessionAuth: AuthFn<Request> = async (request) => {
  const principal = await authenticateDemoRequest(request);
  if (!principal) return null;

  if (principal.role !== "customer") {
    throw new ForbiddenError({
      code: "customer_role_required",
      message: "A customer session is required for this agent.",
    });
  }

  return {
    attributes: {
      email: principal.email,
      name: principal.name,
      role: principal.role,
      workspaceId: principal.workspaceId,
    },
    authenticator: "demo-session",
    issuer: "multi-agent-services:demo",
    principalId: principal.id,
    principalType: "user",
  };
};

export default eveChannel({
  auth: [customerSessionAuth, vercelOidc(), localDev()],
});
