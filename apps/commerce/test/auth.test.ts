import { createCommerceAccessToken } from "@repo/demo-auth";
import { mockEvent } from "nitro/h3";
import { afterEach, describe, expect, it } from "vitest";

import { authorizeRequest, readBearerToken } from "../server/utils/auth";

describe("commerce authorization", () => {
  afterEach(() => {
    delete process.env.DEMO_AUTH_SECRET;
  });

  it("authenticates a bearer token and enforces its role", async () => {
    process.env.DEMO_AUTH_SECRET = "test-secret-with-at-least-32-characters";
    const token = await createCommerceAccessToken({
      id: "usr_customer_avery",
      role: "customer",
      workspaceId: "wrk_reference_store",
    });
    const event = mockEvent("https://commerce.example/api/v1/cart", {
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(authorizeRequest(event, ["customer"])).resolves.toMatchObject({
      id: "usr_customer_avery",
      workspaceId: "wrk_reference_store",
    });
    await expect(authorizeRequest(event, ["admin"])).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejects missing and oversized credentials", () => {
    expect(() => readBearerToken(new Headers())).toThrow();
    expect(() =>
      readBearerToken(
        new Headers({ authorization: `Bearer ${"a".repeat(4097)}` }),
      ),
    ).toThrow();
  });
});
