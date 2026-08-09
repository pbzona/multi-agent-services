import { afterEach, describe, expect, it } from "vitest";

import {
  authenticateDemoRequest,
  createCommerceAccessToken,
  createDemoSessionToken,
  DEMO_SESSION_COOKIE,
  verifyCommerceAccessToken,
  verifyDemoSessionToken,
} from "../src/index.js";

describe("demo auth", () => {
  const testSecret = "test-secret-with-at-least-32-characters";

  afterEach(() => {
    delete process.env.DEMO_AUTH_SECRET;
  });

  it("round-trips a customer session", async () => {
    process.env.DEMO_AUTH_SECRET = testSecret;
    const token = await createDemoSessionToken("customer");
    const principal = await verifyDemoSessionToken(token);
    expect(principal.role).toBe("customer");
    expect(principal.id).toBe("usr_customer_avery");
  });

  it("authenticates a standard Request cookie", async () => {
    process.env.DEMO_AUTH_SECRET = testSecret;
    const token = await createDemoSessionToken("admin");
    const principal = await authenticateDemoRequest(
      new Request("https://example.com", {
        headers: { cookie: `${DEMO_SESSION_COOKIE}=${token}` },
      }),
    );
    expect(principal?.role).toBe("admin");
  });

  it("round-trips a commerce actor", async () => {
    process.env.DEMO_AUTH_SECRET = testSecret;
    const token = await createCommerceAccessToken({
      id: "usr_admin_riley",
      role: "admin",
      workspaceId: "wrk_reference_store",
    });
    await expect(verifyCommerceAccessToken(token)).resolves.toEqual({
      id: "usr_admin_riley",
      role: "admin",
      workspaceId: "wrk_reference_store",
    });
  });

  it("rejects a malformed cookie", async () => {
    process.env.DEMO_AUTH_SECRET = testSecret;
    const principal = await authenticateDemoRequest(
      new Request("https://example.com", {
        headers: { cookie: `${DEMO_SESSION_COOKIE}=%` },
      }),
    );
    expect(principal).toBeNull();
  });
});
