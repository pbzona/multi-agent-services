import "server-only";

import {
  DEMO_PERSONAS,
  DEMO_SESSION_COOKIE,
  verifyDemoSessionToken,
  type DemoPrincipal,
} from "@repo/demo-auth";
import { cookies } from "next/headers";
import { cache } from "react";

export const getDemoPrincipal = cache(async (): Promise<DemoPrincipal> => {
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;

  if (token) {
    try {
      return await verifyDemoSessionToken(token);
    } catch {
      // The proxy replaces invalid sessions; keep this render usable meanwhile.
    }
  }

  return DEMO_PERSONAS.customer;
});
